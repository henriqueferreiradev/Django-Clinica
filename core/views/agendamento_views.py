from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.csrf import csrf_exempt 
from django.contrib.auth.decorators import login_required
from django.utils.dateparse import parse_date
from core.utils import filtrar_ativos_inativos, alterar_status_ativo,gerar_mensagem_confirmacao, enviar_lembrete_email,alterar_status_agendamento
from core.models import Paciente, Especialidade,Profissional, Servico,PacotePaciente,Agendamento,Pagamento, ESTADO_CIVIL, MIDIA_ESCOLHA, VINCULO, COR_RACA, UF_ESCOLHA,SEXO_ESCOLHA, CONSELHO_ESCOLHA
from datetime import date, datetime, timedelta
from django.http import JsonResponse
from django.db.models import Sum, Q, Count
from collections import defaultdict
from django.contrib import messages
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

import uuid
@login_required(login_url='login')
def agenda_view(request):
    query = request.GET.get('q', '').strip()

    # Recupera filtros se houverem
    data_inicio = request.GET.get('data_inicio')
    data_fim = request.GET.get('data_fim')

    filtros = {
        'data_inicio': data_inicio,
        'data_fim': data_fim,
    }

    dados_agrupados = listar_agendamentos(filtros=filtros, query=query)
    agendamentos = Agendamento.objects.all()
    especialidades = Especialidade.objects.all()
    profissionais = Profissional.objects.all()
    servicos = Servico.objects.all()
    status_remarcaveis = ['d','dcr', 'fcr']
    context = {
        'especialidades': especialidades,
        'profissionais': profissionais,
        'servicos': servicos,
        'agendamentos_agrupados': dados_agrupados,
        'query': query,
        'agendamentos':agendamentos,
        'status_remarcaveis': status_remarcaveis,
    }

    return render(request, 'core/agendamentos/agenda.html', context)






def proxima_data_semana(data_inicial, dia_semana_index):
    if data_inicial is None:
        raise ValueError("Data inicial não pode ser None.")
    if not isinstance(dia_semana_index, int) or dia_semana_index < 0 or dia_semana_index > 6:
        raise ValueError("Índice de dia da semana inválido.")
    
    delta_dias = (dia_semana_index - data_inicial.weekday() + 7) % 7
    return data_inicial + timedelta(days=delta_dias)


@login_required(login_url='login')
def criar_agendamento(request):
    
    if request.method == 'POST':
        data = request.POST
        
        tipo_agendamento = data.get('tipo_agendamento')
        paciente_id = data.get('paciente_id')
        servico_id = data.get('servico_id')

        if servico_id in ['d', 'dcr', 'fcr']:
            servico = None
            tipo_reposicao = servico_id
            servico_id_int = None
        else:
            try:
                servico_id_int = int(servico_id)
            except (ValueError, TypeError):
                return JsonResponse({'error': 'Serviço inválido'}, status=400)
            servico = get_object_or_404(Servico, id=servico_id_int)
            tipo_reposicao = None
        especialidade_id = data.get('especialidade_id')
        profissional1_id = data.get('profissional1_id')
        profissional2_id = data.get('profissional2_id')
        data_sessao = parse_date(data.get('data'))
        hora_inicio = data.get('hora_inicio')
        hora_fim = data.get('hora_fim')

        def parse_float(value, default=0.0):
            try:
                return float(value)
            except (ValueError, TypeError):
                return default

        valor_pacote = parse_float(data.get('valor_pacote'))
        print("VALOR DO PACOTE:", data.get('valor_pacote'))
        desconto = parse_float(data.get('desconto'))
        valor_final = parse_float(data.get('valor_final'))
        modo_desconto = data.get('modo_desconto')
        ambiente = data.get('ambiente')
        status = data.get('status')
        observacoes = data.get('observacoes', '')
        pacote_codigo = data.get('pacote_codigo')

        # Pagamento
        valor_pago = data.get('valor_pago')
        forma_pagamento = data.get('forma_pagamento')
        

        # Recorrência
        agendamento_recorrente = data.get('recorrente') == 'on'
        recorrencia_dia_index = data.get('recorrencia_dia')
        try:
            recorrencia_dia_index = int(recorrencia_dia_index)
        except (ValueError, TypeError):
            recorrencia_dia_index = None

        def id_valido(value):
            try:
                return int(value)
            except (ValueError, TypeError):
                return None

        paciente_id_int = id_valido(paciente_id)
        servico_id_int = id_valido(servico_id)
        especialidade_id_int = id_valido(especialidade_id)
        profissional1_id_int = id_valido(profissional1_id)
        profissional2_id_int = id_valido(profissional2_id)

        if not paciente_id_int:
            return JsonResponse({'error': 'Paciente inválido'}, status=400)
 
        if not especialidade_id_int:
            return JsonResponse({'error': 'Especialidade inválida'}, status=400)
        if not profissional1_id_int:
            return JsonResponse({'error': 'Profissional principal inválido'}, status=400)

        paciente = get_object_or_404(Paciente, id=paciente_id_int)
        especialidade = get_object_or_404(Especialidade, id=especialidade_id_int)
        profissional1 = get_object_or_404(Profissional, id=profissional1_id_int)
        profissional2 = Profissional.objects.filter(id=profissional2_id_int).first() if profissional2_id_int else None
        pacote = None

        if tipo_agendamento == 'novo':
            pacote = PacotePaciente.objects.create(
                paciente=paciente,
                servico=servico,
                valor_original=valor_pacote,
                desconto_reais=desconto if modo_desconto == 'R$' else None,
                desconto_percentual=desconto if modo_desconto == '%' else None,
                valor_final=valor_final,
                valor_total=valor_pacote,
                ativo=True,
            )
        elif tipo_agendamento == 'existente':
            pacote = get_object_or_404(PacotePaciente, codigo=pacote_codigo)

        elif tipo_agendamento == 'reposicao':
            # Passo 1: Identificar qual agendamento gerou o crédito (ex: o mais recente)
            agendamento_origem = Agendamento.objects.filter(
                paciente_id=paciente_id,
                status="desistencia_remarcacao",
                foi_reposto=False
            ).order_by('-data').first()  # Pega o último agendamento que gerou crédito

            # Passo 2: Criar a reposição
            pacote = PacotePaciente.objects.create(
                paciente=paciente,
                servico=None,
                qtd_sessoes=1,
                valor_original=valor_pacote or 0,
                valor_final=valor_final or 0,
                ativo=True,
                tipo_reposicao=tipo_reposicao,
                eh_reposicao=True
            )
            pacote.codigo = f'REP{uuid.uuid4().hex[:8].upper()}'
            pacote.save()

            # Passo 3: Marcar o agendamento de origem como reposto (se existir)
            if agendamento_origem:
                agendamento_origem.foi_reposto = True
                agendamento_origem.save()






        
        if agendamento_recorrente and pacote and recorrencia_dia_index is not None:
            primeira_data = proxima_data_semana(data_sessao, recorrencia_dia_index)
            sessoes_restantes = pacote.qtd_sessoes - pacote.sessoes_realizadas
            num_sessoes = sessoes_restantes
            datas_agendamentos = [primeira_data + timedelta(weeks=i) for i in range(num_sessoes)]

 
        else:
            datas_agendamentos = [data_sessao]

        agendamentos_criados = []

        for data_agendamento in datas_agendamentos:
            agendamento = Agendamento.objects.create(
                paciente=paciente,
                servico=servico,
                especialidade=especialidade,
                profissional_1=profissional1,
                profissional_2=profissional2,
                data=data_agendamento,
                hora_inicio=hora_inicio,
                hora_fim=hora_fim,
                pacote=pacote,
                status=status,
                ambiente=ambiente,
                observacoes=observacoes
            )
            agendamentos_criados.append(agendamento)

        if valor_pago and float(valor_pago) > 0:
            Pagamento.objects.create(
                paciente=paciente,
                pacote=pacote,
                valor=float(valor_pago),
                forma_pagamento=forma_pagamento,
                agendamento=agendamentos_criados[0],
            )

        
        if pacote:
            pacote.refresh_from_db()
            total_pago = pacote.pagamento_set.aggregate(total=Sum('valor'))['total'] or 0
            valor_restante = float(pacote.valor_final) - float(total_pago)

            sessoes_realizadas = pacote.sessoes_realizadas
            sessao_atual = pacote.get_sessao_atual(agendamentos_criados[-1])  # última sessão criada
            sessoes_restantes = pacote.qtd_sessoes - sessoes_realizadas

            if sessoes_realizadas >= pacote.qtd_sessoes:
                pacote.ativo = False
                pacote.save()
            
        else:
            sessao_atual = None
            sessoes_restantes = None
            valor_restante = None
            total_pago = 0

        # Redirecionar para o último agendamento criado
        return redirect('confirmacao_agendamento', agendamento_id=agendamentos_criados[-1].id)

    return JsonResponse({'error': 'Método não permitido'}, status=405)

def verificar_pacotes_ativos(request, paciente_id):
    pacotes = PacotePaciente.objects.filter(paciente_id=paciente_id, ativo=True)
    
    pacotes_data = []

    for pacote in pacotes:
        sessoes_usadas = pacote.sessoes_realizadas
        pacotes_data.append({
            "codigo": pacote.codigo,
            "quantidade_total": pacote.qtd_sessoes,
            "quantidade_usadas": sessoes_usadas,
            "valor_total": float(pacote.valor_total),
            "valor_pago": float(pacote.total_pago),   
            "valor_restante": float(pacote.valor_restante),
            'servico_id': pacote.servico.id  
        })
    desmarcacoes = Agendamento.objects.filter(
        paciente_id=paciente_id,
        pacote__isnull=False,
        status__in=["desistencia", "desistencia_remarcacao", "falta_remarcacao"],
        foi_reposto=False  
    ).values("status").annotate(total=Count("id"))
    saldos_desmarcacoes = {
        'desistencia':0,
        'desistencia_remarcacao':0,
        'falta_remarcacao':0,
    }
    for d in desmarcacoes:
        saldos_desmarcacoes[d['status']] = d['total']
        
    return JsonResponse({
        "tem_pacote_ativo": pacotes.exists(),
        "pacotes": pacotes_data,
        "saldos_desmarcacoes": saldos_desmarcacoes,
    })

def listar_agendamentos(filtros=None, query=None):
    filtros = filtros or {}

    data_inicio = filtros.get('data_inicio')
    data_fim = filtros.get('data_fim')

    qs_filtros = {}

    if data_inicio:
        qs_filtros["data__gte"] = data_inicio
    if data_fim:
        qs_filtros["data__lte"] = data_fim
    if not data_inicio and not data_fim:
        qs_filtros['data__gte'] = date.today()

    agendamentos = Agendamento.objects.select_related(
        'paciente', 'profissional_1', 'profissional_1__especialidade'
    ).filter(
        **qs_filtros
    ).order_by('data', 'hora_inicio')

    if query:
        agendamentos = agendamentos.filter(
            Q(paciente__nome__icontains=query) |
            Q(paciente__sobrenome__icontains=query) |
            Q(profissional_1__nome__icontains=query) |
            Q(profissional_1__sobrenome__icontains=query)
        )

    dados_agrupados = {}
    dias_semana_pt = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo']

    for ag in agendamentos:
        data_formatada = ag.data.strftime("%d/%m/%Y")
        dia_semana = dias_semana_pt[ag.data.weekday()]
        chave_data = f"{data_formatada} - {dia_semana}"

        if chave_data not in dados_agrupados:
            dados_agrupados[chave_data] = []

        especialidade = getattr(ag.profissional_1.especialidade, 'nome', '')
        cor_especialidade = getattr(ag.profissional_1.especialidade, 'cor', '#ccc')

        pacote = ag.pacote
        codigo = ag.pacote.codigo if ag.pacote else 'Reposição'
        sessao_atual = pacote.get_sessao_atual(ag) if pacote else None
        sessoes_total = pacote.qtd_sessoes if pacote else None
        sessoes_restantes = max(sessoes_total - sessao_atual, 0)

        dados_agrupados[chave_data].append({
            'id': ag.id,
            'hora_inicio': ag.hora_inicio.strftime('%H:%M'),
            'hora_fim': ag.hora_fim.strftime('%H:%M') if ag.hora_fim else '',
            'paciente': f"{ag.paciente.nome} {ag.paciente.sobrenome}",
            'profissional': f"{ag.profissional_1.nome} {ag.profissional_1.sobrenome}",
            'especialidade': especialidade,
            'cor_especialidade': cor_especialidade,
            'status': ag.status,
            'sessao_atual': sessao_atual,
            'sessoes_total': sessoes_total,
            'sessoes_restantes':sessoes_restantes,
            'codigo':codigo,
            'is_reposicao': bool(ag.pacote and ag.pacote.tipo_reposicao),
            'is_pacote': bool(ag.pacote and not ag.pacote.tipo_reposicao),
        })

    return dados_agrupados

def confirmacao_agendamento(request, agendamento_id):
    agendamento = get_object_or_404(Agendamento, id=agendamento_id)
    paciente = agendamento.paciente
    profissional = agendamento.profissional_1
    servico = agendamento.servico
    pacote = agendamento.pacote

    agendamentos_recorrentes = Agendamento.objects.filter(pacote=agendamento.pacote).order_by('data', 'hora_inicio')
    codigo_pacote = agendamento.pacote.codigo if agendamento.pacote else None
    print(codigo_pacote, agendamentos_recorrentes)

    total_pago = pacote.total_pago if pacote else 0
    valor_restante = pacote.valor_restante if pacote else 0
    sessao_atual = pacote.sessoes_realizadas if pacote else None
    sessoes_restantes = pacote.sessoes_restantes if pacote else None
    try:
        validate_email(paciente.email)
    except ValidationError:
        messages.error(request, 'O e-mail do paciente é inválido.')
        return redirect('agenda')
    mensagem = gerar_mensagem_confirmacao(agendamento)
    
    context = {
        'agendamento': agendamento,
        'paciente': paciente,
        'profissional': profissional,
        'servico': servico, 
        'pacote': pacote,
        'forma_pagamento': None,
        'valor_pago': total_pago,
        'valor_restante': valor_restante,
        'sessao_atual': sessao_atual,
        'sessoes_restantes': sessoes_restantes,
        'mensagem_confirmacao': mensagem,
        'agendamentos_recorrentes':agendamentos_recorrentes,
    }

    response = render(request, 'core/agendamentos/confirmacao_agendamento.html', context)
    response['Content-Type'] = 'text/html; charset=utf-8'
    return response

def enviar_email_agendamento(request, agendamento_id):
    if request.method == "POST":
        agendamento = get_object_or_404(Agendamento, id=agendamento_id)
        paciente = agendamento.paciente
        profissional = agendamento.profissional_1.nome
        atividade = agendamento.especialidade.nome  
        contexto = {
            "nome":paciente,
            "profissional":profissional,
            "atividade": atividade,
            "data_dia":agendamento.data.strftime('%d/%m/%Y'),
            "data_semana": agendamento.data.strftime('%A').capitalize(),
            "hora_inicio": agendamento.hora_inicio.strftime('%H:%M'),
            "hora_fim":agendamento.hora_fim.strftime('%H:%M'),
        }

        enviar_lembrete_email(paciente.email, contexto)

        return JsonResponse({'status': 'ok', 'mensagem': 'E-mail enviado com sucesso'})

    return JsonResponse({'status': 'erro', 'mensagem': 'Requisição inválida'}, status=400)


def alterar_status_agenda(request, pk):
    return alterar_status_agendamento(request,pk,redirect_para='agenda')

def remarcar_agendamento(request, pk):
    if request.method == "POST":
        agendamento_original = get_object_or_404(Agendamento, pk=pk)

        # Dados da remarcação (exemplo: nova data e hora)
        nova_data = request.POST.get("data")
        nova_hora = request.POST.get("hora")

        # Cria um novo agendamento vinculado ao original
        novo = Agendamento.objects.create(
            paciente=agendamento_original.paciente,
            profissional=agendamento_original.profissional,
            servico=agendamento_original.servico,
            pacote=agendamento_original.pacote,
            data=nova_data,
            hora=nova_hora,
            status="agendado",  # ou o status padrão de agendado
            valor_total=0,  # não cobra valor na remarcação
            valor_pago=0,
            remarcado_de=agendamento_original,
            criado_por=request.user  # se tiver
        )
        messages.success(request, "Agendamento remarcado com sucesso.")
        return redirect('agenda')

def pegar_agendamento(request, agendamento_id):

    agendamento = get_object_or_404(Agendamento, id=agendamento_id)
    pacote = agendamento.pacote

    total_pago = pacote.total_pago if pacote else 0

    forma_pagamento = ""
    if pacote:
        pagamento = pacote.pagamento_set.order_by('-data').first()
        forma_pagamento = pagamento.forma_pagamento if pagamento else ""
        
    forma_pagamento_display = pagamento.get_forma_pagamento_display() if pagamento else ""

    if pacote:
        pagamentos = pacote.pagamento_set.all().order_by('data')
    else:
        pagamentos = agendamento.pagamento_set.all().order_by('data')

    pagamentos_data = [
        {
            'valor': str(p.valor),
            'data': p.data.strftime('%Y-%m-%d'),
            'forma_pagamento': p.forma_pagamento,
            'forma_pagamento_display':p.get_forma_pagamento_display(),
        }
        for p in pagamentos
    ]

    data = {
        'profissional1_id': agendamento.profissional_1.id if agendamento.profissional_1 else None,
        'data': agendamento.data.strftime('%Y-%m-%d'),
        'hora_inicio': agendamento.hora_inicio.strftime('%H:%M'),
        'hora_fim': agendamento.hora_fim.strftime('%H:%M'),
        'profissional2_id': agendamento.profissional_2.id if agendamento.profissional_2 else None,
        'hora_inicio_aux': agendamento.hora_inicio_aux.strftime('%H:%M') if agendamento.hora_inicio_aux else '',
        'hora_inicio_aux': agendamento.hora_inicio_aux.strftime('%H:%M') if agendamento.hora_inicio_aux else '',
        'hora_fim_aux': agendamento.hora_fim_aux.strftime('%H:%M') if agendamento.hora_fim_aux else '',
        'valor_pago': str(total_pago),
        'forma_pagamento': forma_pagamento,
        'forma_pagamento_display':forma_pagamento_display,
        'paciente_id': agendamento.paciente.id,
        'servico_id': agendamento.servico.id if agendamento.servico else None,
        'pagamentos': pagamentos_data,
    }

    return JsonResponse(data)
 
def editar_agendamento(request, agendamento_id):
    if request.method == 'POST':
        try:
            agendamento = Agendamento.objects.get(pk=agendamento_id)
            data = request.POST

          
            profissional_1_id = data.get('profissional1_id')
            if profissional_1_id:
                agendamento.profissional_1 = Profissional.objects.get(pk=profissional_1_id)
            else:
                agendamento.profissional_1 = None

            profissional_2_id = data.get('profissional2_id')
            if profissional_2_id:
                agendamento.profissional_2 = Profissional.objects.get(pk=profissional_2_id)
            else:
                agendamento.profissional_2 = None

        
            agendamento.data = data.get('data')
            hora_inicio = data.get('hora_inicio')
            hora_fim = data.get('hora_fim')
            for key, value in request.POST.items():
                print(f'{key} = {value}')
            try:
                if hora_inicio:
                    agendamento.hora_inicio = datetime.strptime(hora_inicio, '%H:%M').time()
                else:
                    raise ValueError('Campo hora_inicio vazio')

                if hora_fim:
                    agendamento.hora_fim = datetime.strptime(hora_fim, '%H:%M').time()
                else:
                    raise ValueError('Campo hora_fim vazio')

            except ValueError as e:
                return JsonResponse({'error': str(e)}, status=400)
            hora_inicio_aux = data.get('hora_inicio_aux')
            agendamento.hora_inicio_aux = datetime.strptime(hora_inicio_aux, '%H:%M').time() if hora_inicio_aux else None

            hora_fim_aux = data.get('hora_fim_aux')
            agendamento.hora_fim_aux = datetime.strptime(hora_fim_aux, '%H:%M').time() if hora_fim_aux else None


            agendamento.save()
            
            # Pagamento 
            if agendamento.pacote and data.get('valor_pago'):
                valor_pago = float(data.get('valor_pago'))
                forma_pagamento = data.get('forma_pagamento')
                Pagamento.objects.create(
                    paciente=agendamento.paciente,
                    pacote=agendamento.pacote,
                    agendamento=agendamento,
                    valor=valor_pago,
                    forma_pagamento=forma_pagamento
                )
            print('POST recebido:', request.POST)
            messages.success(request, 'Agendamento editado com sucesso!')
            return JsonResponse({'status': 'ok'})

        except Agendamento.DoesNotExist:
            return JsonResponse({'error': 'Agendamento não encontrado'}, status=404)
        except Profissional.DoesNotExist:
            return JsonResponse({'error': 'Profissional não encontrado'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Método não permitido'}, status=405)
