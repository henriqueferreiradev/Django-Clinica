from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.csrf import csrf_exempt 
from django.contrib.auth.decorators import login_required
from django.utils.dateparse import parse_date
from core.utils import filtrar_ativos_inativos, alterar_status_ativo,gerar_mensagem_confirmacao, enviar_lembrete_email
from core.models import Paciente, Especialidade,Profissional, Servico,PacotePaciente,Agendamento,Pagamento, ESTADO_CIVIL, MIDIA_ESCOLHA, VINCULO, COR_RACA, UF_ESCOLHA,SEXO_ESCOLHA, CONSELHO_ESCOLHA
from datetime import date, datetime, timedelta
from django.http import JsonResponse
from django.db.models import Sum, Q
from collections import defaultdict
from django.contrib import messages


@login_required(login_url='login')
@csrf_exempt
def agenda_view(request):

    query = request.GET.get('q', '').strip()
    dados_agrupados = listar_agendamentos(query=query)
    especialidades = Especialidade.objects.all()
    profissionais = Profissional.objects.all()
    servicos = Servico.objects.all()
    
    context = {
        'especialidades': especialidades,
        'profissionais': profissionais,
        'servicos': servicos,
        'agendamentos_agrupados': dados_agrupados,
        'query': query,
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
        if not servico_id_int:
            return JsonResponse({'error': 'Serviço inválido'}, status=400)
        if not especialidade_id_int:
            return JsonResponse({'error': 'Especialidade inválida'}, status=400)
        if not profissional1_id_int:
            return JsonResponse({'error': 'Profissional principal inválido'}, status=400)

        paciente = get_object_or_404(Paciente, id=paciente_id_int)
        servico = get_object_or_404(Servico, id=servico_id_int)
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
                ativo=True
            )
        elif tipo_agendamento == 'existente':
            pacote = get_object_or_404(PacotePaciente, codigo=pacote_codigo)

        # Geração das datas recorrentes
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

    return JsonResponse({
        "tem_pacote_ativo": pacotes.exists(),
        "pacotes": pacotes_data
    })

def listar_agendamentos(query=None):
    agendamentos = Agendamento.objects.select_related(
        'paciente', 'profissional_1', 'profissional_1__especialidade'
    ).filter(
        data__gte=date.today()
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
        codigo = ag.pacote.codigo
        sessao_atual = pacote.get_sessao_atual(ag) if pacote else None
        sessoes_total = pacote.qtd_sessoes if pacote else None
        sessoes_restantes = sessoes_total - sessao_atual

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
            'codigo':codigo
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


def alterar_status(request,pk):
    if request.method == "POST":
        agendamento = get_object_or_404(Agendamento, pk=pk)
        novo_status = request.POST.get('status')

        if novo_status:
            agendamento.status = novo_status
            print(novo_status)
            agendamento.save()
        messages.success(request, f'Status alterado para {agendamento.get_status_display()}')
    return redirect('agenda')