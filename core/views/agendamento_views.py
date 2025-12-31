from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.csrf import csrf_exempt 
from django.contrib.auth.decorators import login_required
from django.utils.dateparse import parse_date
from core.services.financeiro import criar_receita_pacote, criar_pagamento
from core.utils import gerar_horarios,gerar_mensagem_confirmacao, enviar_lembrete_email,alterar_status_agendamento, registrar_log
from core.models import Agendamento, CONSELHO_ESCOLHA, COR_RACA, ESTADO_CIVIL, Especialidade, MIDIA_ESCOLHA, Paciente, PacotePaciente, Pagamento, Profissional, Receita, SEXO_ESCOLHA, STATUS_CHOICES, Servico, UF_ESCOLHA, VINCULO
from datetime import date, datetime, timedelta
from django.http import JsonResponse
from django.db.models import Sum, Q, Count
from collections import defaultdict
from django.contrib import messages
import uuid
from django.utils.timezone import now
from decimal import Decimal, InvalidOperation


@login_required(login_url='login')
def agenda_view(request):
    query = request.GET.get('q', '').strip()

    # Recupera filtros se houverem
    data_inicio = request.GET.get('data_inicio')
    data_fim = request.GET.get('data_fim')
    especialidade = request.GET.get('especialidade_id')
    status=request.GET.get('status')



    filtros = {
        'data_inicio': data_inicio,
        'data_fim': data_fim,
        'especialidade':especialidade,
        'status': status,
         

    }

    dados_agrupados = listar_agendamentos(filtros=filtros, query=query)
    agendamentos = Agendamento.objects.all()
    especialidades = Especialidade.objects.filter(ativo=True)
    profissionais = Profissional.objects.filter(ativo=True)
    servicos = Servico.objects.filter(ativo=True)



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



from django.utils.timezone import now
from datetime import datetime
from math import ceil
def agenda_board(request):
    # Pega a data da query string ou usa hoje
    date_str = request.GET.get('date')
    if date_str:
        try:
            selected_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except:
            selected_date = now().date()
    else:
        selected_date = now().date()
    
    # Filtra agendamentos pela data selecionada
    agendamentos = Agendamento.objects.filter(data=selected_date)
    
    # Busca todos os profissionais (modelo Profissional)
    # Mas também filtramos apenas os que têm User com tipo='profissional'
    profissionais = Profissional.objects.filter(
        user__tipo='profissional'
    ).order_by('nome')
    
    # Para incluir também profissionais que não têm user (se houver)
    # profissionais = Profissional.objects.all().order_by('nome')
    
    # Criar lista de profissionais com informações
    profissionais_list = []
    for prof in profissionais:
        # Verifica se tem agendamento na data selecionada
        tem_agenda = agendamentos.filter(profissional_1=prof).exists()
        
        # Usa o nome do profissional (do modelo Profissional)
        nome_completo = f"{prof.nome}" if prof.sobrenome else prof.nome
        
        profissionais_list.append({
            'id': prof.id,
            'nome': nome_completo,
            'user_id': prof.user.id if prof.user else None,
            'tem_agenda': tem_agenda
        })
    
    # Formatar data para exibição
    formatted_date = selected_date.strftime('%Y-%m-%d')
    
    # Verificar se é hoje
    is_today = selected_date == now().date()
    
    # Gerar horários de 30 em 30 minutos das 07:00 às 19:00
    horarios = []
    hora = 7
    minuto = 0
    
    while hora < 19 or (hora == 19 and minuto == 0):
        horarios.append(f"{hora:02d}:{minuto:02d}")
        minuto += 30
        if minuto >= 60:
            hora += 1
            minuto = 0
 
    for ag in agendamentos:
        ag.horarios_ocupados = []

        if not ag.hora_inicio:
            continue

        inicio = datetime.combine(selected_date, ag.hora_inicio)


        if ag.hora_fim:
            fim = datetime.combine(selected_date, ag.hora_fim)
            duracao_minutos = int((fim - inicio).total_seconds() / 60)
        else:
            duracao_minutos = 60  

        slots = ceil(duracao_minutos / 30)

        for i in range(slots):
            slot = inicio + timedelta(minutes=30 * i)
            ag.horarios_ocupados.append(slot.strftime("%H:%M"))
    
    context = {
        "agendamentos": agendamentos,
        "horarios": horarios,
        "profissionais": profissionais_list,
        "selected_date": formatted_date,
        "is_today": is_today,
        "today_date": now().date().strftime('%Y-%m-%d'),
    }
    return render(request, "core/agendamentos/agenda_board.html", context)


def api_detalhar_agendamento(request, agendamento_id):
    agendamento = get_object_or_404(Agendamento, id=agendamento_id)
    return JsonResponse({
        "id": agendamento.id,
        
        "paciente_nome_completo": f"{agendamento.paciente.nome} {agendamento.paciente.sobrenome}",
        'paciente_email':agendamento.paciente.email,
        'paciente_celular':agendamento.paciente.celular,
        "profissional_nome_completo": f'{agendamento.profissional_1.nome}{agendamento.profissional_1.sobrenome}',
        "especialidade": agendamento.especialidade.nome,
        "data": agendamento.data.strftime("%d-%m-%Y"),
        "hora_inicio": agendamento.hora_inicio.strftime("%H:%M") if agendamento.hora_inicio else None,
        "hora_fim": agendamento.hora_fim.strftime("%H:%M") if agendamento.hora_fim else None,
        "status": agendamento.status,
        'observacoes':agendamento.observacoes,
        'sessao_atual': agendamento.pacote.sessoes_realizadas,
        'sessoes_restantes': agendamento.pacote.sessoes_restantes,
        'qtd_sessoes':agendamento.pacote.qtd_sessoes,

    })




def proxima_data_semana(data_inicial, dia_semana_index):
    if data_inicial is None:
        raise ValueError("Data inicial não pode ser None.")
    if not isinstance(dia_semana_index, int) or dia_semana_index < 0 or dia_semana_index > 6:
        raise ValueError("Índice de dia da semana inválido.")
    
    delta_dias = (dia_semana_index - data_inicial.weekday() + 7) % 7
    return data_inicial + timedelta(days=delta_dias)

 
@login_required(login_url='login')
def criar_agendamento(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método não permitido'}, status=405)

    data = request.POST

    # --- CAMPOS BÁSICOS ---
    tipo_agendamento   = data.get('tipo_agendamento')            # novo | existente | reposicao
    paciente_id        = data.get('paciente_id')
    servico_id_raw     = data.get('servico_id')                   # pode vir 'd','dcr','fcr' ou um id numérico
    especialidade_id   = data.get('especialidade_id')
    profissional1_id   = data.get('profissional1_id')
    profissional2_id   = data.get('profissional2_id')
    data_sessao        = parse_date(data.get('data'))
    hora_inicio        = data.get('hora_inicio')
    hora_fim           = data.get('hora_fim')
    status_ag          = data.get('status')
    ambiente           = data.get('ambiente')
    observacoes        = data.get('observacoes', '')
    pacote_codigo_form = data.get('pacote_codigo')

    # benefício vindo do front (hidden)
    beneficio_tipo       = data.get('beneficio_tipo')  # 'sessao_livre' | 'relaxante' | 'desconto' | 'brinde' | ''
    beneficio_percentual = Decimal(data.get('beneficio_percentual') or 0)

    # valores
    def _d(v, default=Decimal('0.00')):
        try:
            return Decimal(str(v))
        except (InvalidOperation, TypeError):
            return default

    valor_pacote  = _d(data.get('valor_pacote'))
    desconto      = _d(data.get('desconto'))
    valor_final   = _d(data.get('valor_final'))
    valor_pago    = _d(data.get('valor_pago'))  # NÃO defina default aqui!
    modo_desconto = data.get('modo_desconto')
    # pagamento
    forma_pagamento = data.get('forma_pagamento')

    # recorrência
    agendamento_recorrente = data.get('recorrente') == 'on'
    try:
        recorrencia_dia_index = int(data.get('recorrencia_dia') or -1)
    except:
        recorrencia_dia_index = None

    # --- VALIDES BÁSICAS ---
    def _id(v):
        try: return int(v)
        except: return None

    paciente_id_int      = _id(paciente_id)
    especialidade_id_int = _id(especialidade_id)
    profissional1_id_int = _id(profissional1_id)
    profissional2_id_int = _id(profissional2_id)

    if not paciente_id_int:
        return JsonResponse({'error': 'Paciente inválido'}, status=400)
    if not especialidade_id_int:
        return JsonResponse({'error': 'Especialidade inválida'}, status=400)
    if not profissional1_id_int:
        return JsonResponse({'error': 'Profissional principal inválido'}, status=400)

    paciente      = get_object_or_404(Paciente, id=paciente_id_int)
    especialidade = get_object_or_404(Especialidade, id=especialidade_id_int)
    profissional1 = get_object_or_404(Profissional, id=profissional1_id_int)
    profissional2 = Profissional.objects.filter(id=profissional2_id_int).first() if profissional2_id_int else None

    # ===================================================================
    # DEFINIÇÃO DE SERVIÇO/PACOTE — NUNCA DEIXAR None
    # ===================================================================
    servico = None
    pacote  = None
    tags_extra = ''

    # 1) Benefício "sessão livre" ou "relaxante" => forçar serviço + pacote BENEF
    if beneficio_tipo in ('sessao_livre', 'relaxante'):
        nome_benef = 'Sessão Livre' if beneficio_tipo == 'sessao_livre' else 'Sessão Relaxante'
        servico, _ = Servico.objects.get_or_create(
            nome=nome_benef,
            defaults={'valor': 0.00, 'qtd_sessoes': 1, 'ativo': True}
        )

        pacote = PacotePaciente.objects.create(
            paciente=paciente,
            servico=servico,
            qtd_sessoes=1,
            valor_original=0,
            valor_final=0,
            valor_total=0,
            ativo=True,
        )
        pacote.codigo = f'BENEF{uuid.uuid4().hex[:8].upper()}'
        pacote.save()

        # garante zero no financeiro desta sessão
        valor_pacote = 0
        desconto     = 0
        valor_final  = 0
        tags_extra   = f'beneficio:{beneficio_tipo}'
        # benefício de status geralmente é 1 sessão -> desliga recorrência
        agendamento_recorrente = False

    # 2) Reposição (D/DCR/FCR) — seu fluxo atual
    elif servico_id_raw in ['d', 'dcr', 'fcr']:
        tipo_reposicao = servico_id_raw
        servico, _ = Servico.objects.get_or_create(
            nome='Sessão de Reposição',
            defaults={'valor': 0.00, 'qtd_sessoes': 1, 'ativo': True}
        )
        pacote = PacotePaciente.objects.create(
            paciente=paciente,
            servico=servico,
            qtd_sessoes=1,
            valor_original=0,
            valor_final=0,
            ativo=True,
            tipo_reposicao=tipo_reposicao,
            eh_reposicao=True
        )
        pacote.codigo = f'REP{uuid.uuid4().hex[:8].upper()}'
        pacote.save()

    # 3) Pacote novo / existente (pago/normal)
    else:
        servico_id_int = _id(servico_id_raw)
        if not servico_id_int:
            return JsonResponse({'error': 'Serviço inválido'}, status=400)
        servico = get_object_or_404(Servico, id=servico_id_int)

        if tipo_agendamento == 'novo':
            pacote = PacotePaciente.objects.create(
                paciente=paciente,
                servico=servico,
                qtd_sessoes=getattr(servico, 'qtd_sessoes', 1) or 1,
                valor_original=valor_pacote,
                desconto_reais=desconto if modo_desconto == 'R$' else None,
                desconto_percentual=desconto if modo_desconto == '%' else None,
                valor_final=valor_final,
                valor_total=valor_pacote,
                ativo=True,
            )
            registrar_log(
                usuario=request.user, acao='Criação', modelo='Pacote Paciente', objeto_id=pacote.id,
                descricao=f'Novo pacote registrado para o {paciente.nome}.'
            )

        elif tipo_agendamento == 'existente':
            pacote = get_object_or_404(PacotePaciente, codigo=pacote_codigo_form)

        else:
            # proteção — se cair aqui, ainda assim não deixa None
            pacote = PacotePaciente.objects.create(
                paciente=paciente, servico=servico, qtd_sessoes=getattr(servico, 'qtd_sessoes', 1) or 1,
                valor_original=valor_pacote, valor_final=valor_final, valor_total=valor_pacote, ativo=True
            )

    # ===================================================================
    # DATAS (recorrência x única) — FORA DO BLOCO ELSE!
    # ===================================================================
    DIAS_SEMANA = {
        "segunda": 0, "terca": 1, "quarta": 2, "quinta": 3, "sexta": 4, "sabado": 5,
    }

    def proxima_data_semana(data_inicial, dia_idx):
        delta = (dia_idx - data_inicial.weekday() + 7) % 7
        return data_inicial + timedelta(days=delta)

    agendamentos_criados = []

    # todos os status consomem sessão do pacote
    STATUS_CONSUME = [s[0] for s in STATUS_CHOICES]

    # já existentes (finalizados, agendados, pré, faltas, desistências etc.)
    ja_existentes = Agendamento.objects.filter(pacote=pacote, status__in=STATUS_CONSUME).count()

    qtd_total = pacote.qtd_sessoes or 1
    faltam = max(0, qtd_total - ja_existentes)

    # identifica os dias ativos de recorrência
    dias_ativos = []
    for dia_nome, dia_idx in DIAS_SEMANA.items():
        if data.get(f"recorrente[{dia_nome}][ativo]"):
            hi = data.get(f"recorrente[{dia_nome}][inicio]")
            hf = data.get(f"recorrente[{dia_nome}][fim]")
            if hi and hf:
                dias_ativos.append((dia_nome, dia_idx, hi, hf))

    tem_recorrencia = len(dias_ativos) > 0

    # VARIÁVEL PARA GUARDAR A PRIMEIRA DATA REAL (para o vencimento)
    primeira_data_real = data_sessao  # <-- Inicializa com a data que o usuário escolheu
    
    if tem_recorrencia and faltam > 0:
        base = data_sessao  # NÃO use max(date.today(), data_sessao)
        
        # distribui os faltantes entre os dias ativos
        q, r = divmod(faltam, len(dias_ativos))
        for i, (dia_nome, dia_idx, hora_inicio_dia, hora_fim_dia) in enumerate(dias_ativos):
            qtd_para_dia = q + (1 if i < r else 0)
            if qtd_para_dia <= 0:
                continue
            
            # Encontra a próxima data para este dia da semana
            primeira = proxima_data_semana(base, dia_idx)
            
            for j in range(qtd_para_dia):
                d = primeira + timedelta(weeks=j)
                ag = Agendamento.objects.create(
                    paciente=paciente,
                    servico=servico,
                    especialidade=especialidade,
                    profissional_1=profissional1,
                    profissional_2=profissional2,
                    data=d,
                    hora_inicio=hora_inicio_dia,
                    hora_fim=hora_fim_dia,
                    pacote=pacote,
                    status=status_ag,
                    ambiente=ambiente,
                    observacoes=observacoes or '',
                    tags=tags_extra,
                )
                agendamentos_criados.append(ag)
    
    elif not tem_recorrencia and faltam > 0:
        # sem recorrência: cria apenas 1 sessão com o horário normal
        ag = Agendamento.objects.create(
            paciente=paciente,
            servico=servico,
            especialidade=especialidade,
            profissional_1=profissional1,
            profissional_2=profissional2,
            data=data_sessao,
            hora_inicio=hora_inicio,
            hora_fim=hora_fim,
            pacote=pacote,
            status=status_ag,
            ambiente=ambiente,
            observacoes=observacoes or '',
            tags=tags_extra,
        )
        agendamentos_criados.append(ag)
        primeira_data_real = data_sessao  # <-- Já está definida, mas explicitamos

    # Para o vencimento, use a PRIMEIRA DATA REAL (não do array)
    # Se tem recorrência, use a data da primeira sessão criada
    # Se não tem recorrência, use data_sessao
    if agendamentos_criados:
        primeira_data_real = agendamentos_criados[0].data
    else:
        primeira_data_real = data_sessao
    
    # =====================================================
    # PAGAMENTO — cria pendente (conta a receber) ou pago
    # =====================================================
    
    # CORREÇÃO: Mostra mensagem apenas quando realmente usou todas as sessões
    if faltam == 0:
        messages.warning(request, f'Todas as sessões deste pacote foram usadas.')
    elif ja_existentes > 0:
        messages.info(request, f'Pacote: {ja_existentes} sessão(ões) usada(s), {faltam} restante(s).')
    
    # CORREÇÃO: Use valor_pago_inicial APENAS se valor_pago for definido e > 0
    valor_pago_inicial_param = valor_pago if valor_pago and valor_pago > 0 else None
    
    # Cria receita com a data correta
    receita = criar_receita_pacote(
        paciente=paciente,
        pacote=pacote,
        valor_final=valor_final,
        vencimento=primeira_data_real,  # CORRETO!
        forma_pagamento=forma_pagamento,
        valor_pago_inicial=valor_pago_inicial_param  # <-- CORRIGIDO
    )

    # CORREÇÃO: REMOVA esta seção de registrar pagamento
    # A função criar_receita_pacote já faz isso quando valor_pago_inicial é passado
    # if valor_pago and valor_pago > 0:
    #     registrar_pagamento(
    #         receita=receita,
    #         paciente=paciente,
    #         pacote=pacote,
    #         agendamento=agendamentos_criados[0] if agendamentos_criados else None,
    #         valor=valor_pago,
    #         forma_pagamento=forma_pagamento
    #     )

    # =====================================================
    # BENEFÍCIO (opcional)
    # =====================================================
    if beneficio_tipo:
        try:
            hoje = date.today()
            valor_desc = None
            if beneficio_tipo == 'desconto':
                valor_desc = round((valor_pacote or 0) - (valor_final or 0), 2)
            usar_beneficio(
                paciente=paciente, mes=hoje.month, ano=hoje.year, tipo=beneficio_tipo,
                usuario=request.user,
                agendamento=agendamentos_criados[0] if agendamentos_criados and beneficio_tipo in ('sessao_livre', 'relaxante') else None,
                valor_desconto=valor_desc
            )
        except Exception as e:
            messages.warning(request, f'Não foi possível registrar o benefício: {e}')

    # =====================================================
    # RETORNO FINAL — sempre garante resposta HTTP
    # =====================================================
    try:
        ultimo_agendamento = agendamentos_criados[-1]
    except IndexError:
        return JsonResponse({'error': 'Nenhum agendamento foi criado.'}, status=400)

    # Caso seja uma chamada da API (como /api/agendamentos/), retorna JSON
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'ok': True,
            'paciente': paciente.nome,
            'servico': servico.nome,
            'agendamentos_criados': len(agendamentos_criados),
            'vencimento': str(receita.vencimento),
            'status_receita': receita.status,
        })

    # Caso contrário (usuário via navegador), abre a página normal
    return redirect('confirmacao_agendamento', agendamento_id=ultimo_agendamento.id)


def verificar_pacotes_ativos(request, paciente_id):
    pacotes = PacotePaciente.objects.filter(paciente_id=paciente_id, ativo=True)
    
    pacotes_data = []
    print(pacotes )
    for pacote in pacotes:
        sessoes_usadas = pacote.sessoes_realizadas
        pacotes_data.append({
            "codigo": pacote.codigo,
            "quantidade_total": pacote.qtd_sessoes,
            "quantidade_usadas": sessoes_usadas,
            "valor_total": float(pacote.valor_total),
           "valor_desconto": float(pacote.valor_desconto),
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
    especialidade = filtros.get('especialidade_id')
    status = filtros.get('status')

    
    qs_filtros = {}

    if data_inicio:
        qs_filtros["data__gte"] = data_inicio
    if data_fim:
        qs_filtros["data__lte"] = data_fim
    if not data_inicio and not data_fim:
        qs_filtros['data__gte'] = date.today()
    if especialidade:
         qs_filtros['especialidade'] = especialidade  # ← Isso filtra pela especialidade do AGENDAMENTO
    if status: 
        qs_filtros['status'] = status

    # CORRIGIR: Incluir 'especialidade' no select_related
    agendamentos = Agendamento.objects.select_related(
        'paciente', 'profissional_1', 'profissional_1__especialidade', 'especialidade'  # ← ADICIONAR AQUI
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
    dias_semana_pt = ['Segunda-feira', 'Terça-feira', 'Quarta-feira',
                      'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo']

    for ag in agendamentos:
        data_formatada = ag.data.strftime("%d/%m/%Y")
        dia_semana = dias_semana_pt[ag.data.weekday()]
        chave_data = f"{data_formatada} - {dia_semana}"

        if chave_data not in dados_agrupados:
            dados_agrupados[chave_data] = []

        # CORREÇÃO: Pegar a especialidade do AGENDAMENTO, não do profissional
        especialidade_nome = getattr(ag.especialidade, 'nome', '')  # ← MUDAR AQUI
        cor_especialidade = getattr(ag.especialidade, 'cor', '#ccc')  # ← MUDAR AQUI

        pacote = getattr(ag, 'pacote', None)

        # Código / flags
        codigo = pacote.codigo if pacote else 'Reposição'
        is_reposicao = bool(pacote and getattr(pacote, 'tipo_reposicao', False))
        is_pacote = bool(pacote and not getattr(pacote, 'tipo_reposicao', False))

        # Sessões (com guardas para None)
        sessao_atual = None
        sessoes_total = None
        sessoes_restantes = None

        if pacote:
            sessao_atual_val = pacote.get_sessao_atual(ag)
            sessoes_total_val = getattr(pacote, 'qtd_sessoes', None)

            if isinstance(sessao_atual_val, int) and isinstance(sessoes_total_val, int):
                sessao_atual = sessao_atual_val
                sessoes_total = sessoes_total_val
                sessoes_restantes = max(sessoes_total - sessao_atual, 0)
            else:
                sessao_atual = None
                sessoes_total = sessoes_total_val if isinstance(sessoes_total_val, int) else None
                sessoes_restantes = None

        dados_agrupados[chave_data].append({
            'id': ag.id,
            'hora_inicio': ag.hora_inicio.strftime('%H:%M') if ag.hora_inicio else '',
            'hora_fim': ag.hora_fim.strftime('%H:%M') if ag.hora_fim else '',
            'paciente': f"{ag.paciente.nome} {ag.paciente.sobrenome}",
            'profissional': f"{ag.profissional_1.nome} {ag.profissional_1.sobrenome}",
            'especialidade': especialidade_nome,  # ← Agora vai mostrar a especialidade correta
            'cor_especialidade': cor_especialidade,
            'status': ag.status,
            'sessao_atual': sessao_atual,
            'sessoes_total': sessoes_total,
            'sessoes_restantes': sessoes_restantes,
            'codigo': codigo,
            'is_reposicao': is_reposicao,
            'is_pacote': is_pacote,
        })

    return dados_agrupados

def confirmacao_agendamento(request, agendamento_id):
    agendamento = get_object_or_404(Agendamento, id=agendamento_id)
    paciente = agendamento.paciente
    profissional = agendamento.profissional_1
    servico = agendamento.servico
    pacote = agendamento.pacote

    agendamentos_recorrentes = list(
        Agendamento.objects.filter(pacote=agendamento.pacote)
        .order_by('data', 'hora_inicio')
    )

    # Mensagem para cada sessão recorrente
    for s in agendamentos_recorrentes:
        s.msg_whatsapp = gerar_mensagem_confirmacao(s)

    # Mensagem “single” (quando não há recorrência)
    mensagem = gerar_mensagem_confirmacao(agendamento)

    total_pago = pacote.total_pago if pacote else 0
    valor_restante = pacote.valor_restante if pacote else 0
    sessao_atual = pacote.sessoes_realizadas if pacote else None
    sessoes_restantes = pacote.sessoes_restantes if pacote else None
    '''
    try:
        validate_email(paciente.email)
    except ValidationError:
        messages.error(request, 'O e-mail do paciente é inválido.')
        return redirect('agenda')
    '''
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

        # para recorrentes:
        'agendamentos_recorrentes': agendamentos_recorrentes,

        # para não recorrente:
        'mensagem_confirmacao': mensagem,
    }

    registrar_log(
        usuario=request.user,
        acao='Visualização',
        modelo='Agendamento',
        objeto_id=agendamento.id,
        descricao=f'Página de confirmação visualizada para o agendamento de {paciente.nome}.'
    )
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
        registrar_log(
            usuario=request.user,
            acao='Envio de e-mail',
            modelo='Agendamento',
            objeto_id=agendamento.id,
            descricao=f'E-mail de confirmação enviado para {paciente.nome} ({paciente.email}).'
        )

        return JsonResponse({'status': 'ok', 'mensagem': 'E-mail enviado com sucesso'})

    return JsonResponse({'status': 'erro', 'mensagem': 'Requisição inválida'}, status=400)

def alterar_status_agenda(request, pk):
    response = alterar_status_agendamento(request, pk, redirect_para='agenda')

    registrar_log(
        usuario=request.user,
        acao='Alteração de status',
        modelo='Agendamento',
        objeto_id=pk,
        descricao='Status do agendamento alterado via tela da agenda.'
    )
    
    return response

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
        registrar_log(
                usuario=request.user,
                acao='Remarcação',
                modelo='Agendamento',
                objeto_id=novo.id,
                descricao=f'Agendamento de {novo.paciente.nome} remarcado para {novo.data.strftime("%d/%m/%Y")} às {novo.hora.strftime("%H:%M")}.'
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
            observacoes = data.get('observacoes')

            agendamento.save()
            registrar_log(
                usuario=request.user,
                acao='Edição',
                modelo='Agendamento',
                objeto_id=agendamento.id,
                descricao=f'Agendamento de {agendamento.paciente.nome} editado para a data {agendamento.data}.'
            )
            # Pagamento 
            if agendamento.pacote and data.get('valor_pago'):
                valor_pago = float(data.get('valor_pago'))
                forma_pagamento = data.get('forma_pagamento')
                
                # BUSCAR A RECEITA DO PACOTE
                receita = Receita.objects.filter(
                    paciente=agendamento.paciente,
                    descricao__icontains=agendamento.pacote.codigo
                ).first()
                
                if receita:
                    Pagamento.objects.create(
                        paciente=agendamento.paciente,
                        pacote=agendamento.pacote,
                        agendamento=agendamento,
                        valor=valor_pago,
                        forma_pagamento=forma_pagamento,
                        status='pago',
                        receita=receita,   
                    )
                    
                    # ATUALIZA O STATUS DA RECEITA
                    receita.atualizar_status_por_pagamentos()
                    
                    registrar_log(
                        usuario=request.user,
                        acao='Criação',
                        modelo='Pagamento',
                        objeto_id=agendamento.id,
                        descricao=f'Pagamento de R${valor_pago:.2f} registrado para {agendamento.paciente.nome}.'
                    )
                else:
                    messages.warning(request, 'Receita não encontrada para vincular o pagamento')

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


# core/views.py
from datetime import date
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from core.models import Paciente, Agendamento
from core.services.beneficios import beneficios_disponiveis, usar_beneficio

@login_required
def verificar_beneficios_mes(request, paciente_id):
    pac = Paciente.objects.get(pk=paciente_id)
    hoje = date.today()
    data = beneficios_disponiveis(pac, mes=hoje.month, ano=hoje.year)
    return JsonResponse(data)

@login_required
def api_usar_beneficio(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método inválido'}, status=405)
    try:
        payload = request.POST or request.JSON  # conforme seu parser
        paciente_id = int(payload.get('paciente_id'))
        tipo = payload.get('tipo')  # 'relaxante' | 'desconto' | 'sessao_livre' | 'brinde'
        agendamento_id = payload.get('agendamento_id')
        valor_desconto = payload.get('valor_desconto')

        pac = Paciente.objects.get(pk=paciente_id)
        ag = Agendamento.objects.filter(pk=agendamento_id).first() if agendamento_id else None
        hoje = date.today()

        uso = usar_beneficio(
            paciente=pac, mes=hoje.month, ano=hoje.year, tipo=tipo,
            usuario=request.user, agendamento=ag,
            valor_desconto=valor_desconto
        )
        return JsonResponse({'ok': True, 'id': uso.id})
    except Exception as e:
        return JsonResponse({'ok': False, 'error': str(e)}, status=400)
