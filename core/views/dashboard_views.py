from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from core.models import Paciente, Especialidade,Profissional, Servico,PacotePaciente,Agendamento,Pagamento, ESTADO_CIVIL, MIDIA_ESCOLHA, VINCULO, COR_RACA, UF_ESCOLHA,SEXO_ESCOLHA, CONSELHO_ESCOLHA
from datetime import date, datetime, timedelta
from django.utils import timezone
from core.utils import alterar_status_agendamento
import json
import locale
from django.db.models.functions import TruncMonth
from django.db.models import Count
import random

locale.setlocale(locale.LC_TIME, 'pt_BR.UTF-8')


DIAS_SEMANA = ['segunda-feira', 'terça-feira', 'quarta-feira',
               'quinta-feira', 'sexta-feira', 'sábado','Domingo']

NOMES_MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
               'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
FINALIZADOS = ['finalizado','desistencia','desistencia_remarcacao','falta_remarcacao','falta_cobrada']
FALTAS = ['desistencia','desistencia_remarcacao','falta_remarcacao','falta_cobrada']
PENDENTES = ['pre','agendado']


@login_required(login_url='login')
def dashboard_view(request):
    
    
    # === Datas principais ===
    hoje = timezone.now().date()
    ontem = hoje - timedelta(days=1)
    primeiro_dia_mes = hoje.replace(day=1)
    ultimo_dia_mes = (primeiro_dia_mes + timedelta(days=32)).replace(day=1) - timedelta(days=1)
    nome_mes_atual = NOMES_MESES[hoje.month - 1].capitalize()
 
    inicio_semana = hoje - timedelta(days=hoje.weekday())
    fim_semana = inicio_semana + timedelta(days=6)
    inicio_semana_passada = inicio_semana - timedelta(days=7)
    fim_semana_passada = inicio_semana_passada + timedelta(days=7)
    sete_dias_atras = hoje - timedelta(days=5)

    # === Consultas em agendamentos ===
    agendamentos = Agendamento.objects.filter(data=date.today()).select_related('especialidade')
    agendamentos_dia = Agendamento.objects.filter(data=date.today()).count()
    agendamentos_dia_finalizados = Agendamento.objects.filter(data=date.today(), status__in=FINALIZADOS).count()
    agendamentos_dia_finalizados_ontem = Agendamento.objects.filter(data=ontem, status__in=FINALIZADOS).count()
    
    agendamentos_dia_pendentes = Agendamento.objects.filter(data=date.today(), status__in=PENDENTES).count()
    faltas_dia = Agendamento.objects.filter(data=date.today(), status__in=FALTAS).count()
    agendamentos_semana = Agendamento.objects.filter(data__gte=inicio_semana, data__lte=fim_semana).count()
    agendamentos_ultimos_6_dias = Agendamento.objects.filter(data__range=(sete_dias_atras, hoje))
    
    
    contagem_semana_passada = agendamentos_ultimos_6_dias.count()
    # === Contagens gerais ===
    total_pacientes_ativos = Paciente.objects.filter(ativo=True).count()
    total_profissionais_ativos = Profissional.objects.filter(ativo=True).count()
    
    # ======== CONTAGENS PARA A VARIAÇÃO =========
    contagem_pacientes_semana_passada = Paciente.objects.filter(data_cadastro__gte=inicio_semana_passada, data_cadastro__lte=fim_semana_passada).count()
    contagem_pacientes_semana_atual = Paciente.objects.filter(data_cadastro__gte=inicio_semana, data_cadastro__lte=fim_semana).count()
    
    contagem_profissionais_semana_passada = Profissional.objects.filter(data_cadastro__gte=inicio_semana_passada, data_cadastro__lte=fim_semana_passada).count()
    contagem_profissionais_semana_atual = Profissional.objects.filter(data_cadastro__gte=inicio_semana, data_cadastro__lte=fim_semana).count()
    
    

    contagem_agendamentos_semana_passada = Agendamento.objects.filter(data__gte=inicio_semana_passada, data__lte=fim_semana_passada).count()
    contagem_agendamentos_semana_atual = Agendamento.objects.filter(data__gte=inicio_semana, data__lte=fim_semana).count()
    
    
    
    # === Exemplo de cálculo de variação (ajuste conforme necessário) ===
    def variacao_percentual(valor_atual, valor_anterior):
        if valor_anterior == 0:
            if valor_atual == 0:
                return 0
            return 100
        variacao = ((valor_atual - valor_anterior) / valor_anterior) * 100
        return round(variacao, 1)

    def percentual_diario(parte, total):
  
        if total == 0:
            return 0
        return round((parte / total) * 100, 1)

    def diferenca_semana(valor_atual, valor_anterior):
        diferenca = valor_atual - valor_anterior
        if diferenca > 0:
            return f'{diferenca} a mais que semana passada.' 
        elif diferenca > 0:
            return f'{abs(diferenca)} a mais que semana passada.'
        else: 
            return "Igual a semana passada"

    variacao_pacientes_ativos = diferenca_semana(contagem_pacientes_semana_atual , contagem_pacientes_semana_passada)
    variacao_profissionais_ativos = diferenca_semana(contagem_profissionais_semana_atual , contagem_profissionais_semana_passada)
    variacao_agendamentos = variacao_percentual(contagem_agendamentos_semana_atual, contagem_agendamentos_semana_passada)
    variacao_sessao = variacao_percentual(agendamentos_dia_finalizados, agendamentos_dia_finalizados_ontem)
    variacao_finalizadas = percentual_diario(agendamentos_dia_finalizados, agendamentos_dia )
    variacao_pendentes =  percentual_diario(faltas_dia, agendamentos_dia)
    print( contagem_profissionais_semana_atual, contagem_profissionais_semana_passada )
    print( contagem_pacientes_semana_atual, contagem_pacientes_semana_passada )
    dias_labels = []
    dias_dados = []
        
    for agendamento in agendamentos:
        pacote = agendamento.pacote
        agendamento.codigo = pacote.codigo if pacote else 'Reposição'
        agendamento.sessao_atual = pacote.get_sessao_atual(agendamento) if pacote else None
        agendamento.sessoes_total = pacote.qtd_sessoes if pacote else None
        agendamento.sessoes_restantes = max(agendamento.sessoes_total - agendamento.sessao_atual, 0) if pacote else None


    for i in range(7):
        dia = sete_dias_atras + timedelta(days=i)
        nome_dia = DIAS_SEMANA[dia.weekday()].capitalize()
        dias_labels.append(dia.strftime(f'%d/%m '))
        count = agendamentos_ultimos_6_dias.filter(data=dia).count()
        dias_dados.append(count)

    grafico_dados_7_dias = {
        'labels': dias_labels,
        'datasets': [{
            'label': 'Agendamentos por dia',
            'data': dias_dados,
            'backgroundColor': 'rgba(127, 67, 150, 0.6)',
            'borderColor': 'rgb(127, 67, 150)',
            'borderWidth': 1,
            'borderRadius':10,
        }]
    }

    grafico_dados_7_dias = {
        'labels': dias_labels,
        'datasets': [{
            'label': 'Agendamentos por dia',
            'data': dias_dados,
            'backgroundColor': 'rgba(127, 67, 150, 0.6)',
            'borderColor': 'rgb(127, 67, 150)',
            'borderWidth': 1,
            'borderRadius':10,
        }]
    }


    inicio_periodo = hoje.replace(day=1) - timedelta(days=365)
    agendamentos_por_mes = (
        Agendamento.objects
        .filter(data__gte=inicio_periodo)
        .annotate(mes=TruncMonth('data')) 
        .values('mes')
        .annotate(total=Count('id'))
        .order_by('mes')
    )

    meses_labels = [
        f"{NOMES_MESES[item['mes'].month - 1].capitalize()}/{item['mes'].year}"
        for item in agendamentos_por_mes
]
    meses_dados = [item['total'] for item in agendamentos_por_mes]

    grafico_evolucao_mensal = {
        'labels':meses_labels,
        'datasets': [{
            'label':f'Agendamentos por mês',
            'data':meses_dados,
            'backgroundColor': 'rgba(127, 67, 150, 0.6)',
            'borderColor': 'rgb(127, 67, 150)',
            'borderWidth': 1,
            'borderRadius':10,
        }] 
    }

    distribuicao_por_profissional = (
        Agendamento.objects.filter(data__range=(primeiro_dia_mes, ultimo_dia_mes)).values('profissional_1__nome').annotate(total=Count('id')).order_by('-total')
    )

    profissionais_labels = [item['profissional_1__nome'] for item in distribuicao_por_profissional]
    dados_profissionais = [item['total'] for item in distribuicao_por_profissional]
    cores_base = [
        'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
        'rgba(201, 203, 207, 0.6)', 'rgba(0, 200, 83, 0.6)', 'rgba(255, 87, 34, 0.6)',
        'rgba(33, 150, 243, 0.6)', 'rgba(124, 77, 255, 0.6)', 'rgba(0, 188, 212, 0.6)',
        'rgba(255, 193, 7, 0.6)', 'rgba(255, 61, 0, 0.6)', 'rgba(121, 85, 72, 0.6)',
        'rgba(158, 158, 158, 0.6)', 'rgba(96, 125, 139, 0.6)', 'rgba(0, 150, 136, 0.6)',
        'rgba(244, 67, 54, 0.6)', 'rgba(233, 30, 99, 0.6)', 'rgba(156, 39, 176, 0.6)',
        'rgba(103, 58, 183, 0.6)', 'rgba(63, 81, 181, 0.6)', 'rgba(3, 169, 244, 0.6)',
        'rgba(0, 191, 165, 0.6)', 'rgba(205, 220, 57, 0.6)', 'rgba(255, 235, 59, 0.6)',
        'rgba(255, 152, 0, 0.6)', 'rgba(121, 134, 203, 0.6)', 'rgba(186, 104, 200, 0.6)',
    ]

    total_profissionais = len(profissionais_labels)
    cores_profissionais = (cores_base * ((total_profissionais // len(cores_base)) + 1))[:total_profissionais]
    
    grafico_distribuicao_por_profissional = {
        'labels': profissionais_labels,
        'datasets': [{
            'label':'Agendamentos no mês',
            'data':dados_profissionais,
            'backgroundColor': cores_profissionais,
            'borderColor': ['white'] * total_profissionais,
            'borderWidth': 1,
          
        }] 
    }
    
    servicos_mais_contratados = (
    PacotePaciente.objects
    .filter(servico__isnull=False, servico__nome__isnull=False)
    .values('servico__nome')
    .annotate(total=Count('id'))
    .order_by('-total')
)
 
    especialidades_mais_contratadas = (
        Agendamento.objects.values('especialidade__nome').annotate(total=Count('id')).order_by('-total')
    )
    
    servicos_labels = [item['servico__nome'] for item in servicos_mais_contratados]
    especialidades_labels = [item['especialidade__nome'] for item in especialidades_mais_contratadas]
    
    servicos_dados = [item['total'] for item in servicos_mais_contratados]
    
    
    total_servicos = len(profissionais_labels)
    cores_servicos = (cores_base * ((total_servicos // len(cores_base)) + 1))[:total_servicos]
    
    grafico_servicos_mais_contratados = {
        'labels': servicos_labels,
        'datasets': [{
            'label':'Agendamentos no mês',
            'data':servicos_dados,
            'backgroundColor': cores_servicos,
            'borderColor': ['white'] * total_servicos,
            'borderWidth': 1,
          
        }] 
    }
    
    
    status_agendamentos = (
        Agendamento.objects.filter(data__range=(primeiro_dia_mes, ultimo_dia_mes)).values('status').annotate(total=Count('id')).order_by('-total')
    )
    status_labels = [item['status'].capitalize() for item in status_agendamentos]
    status_dados = [item['total'] for item in status_agendamentos]
    
    
    grafico_status_agendamentos = {
        'labels': status_labels,
        'datasets': [{
            'label': '',
            'data': status_dados,  
            'backgroundColor': 'rgba(127, 67, 150, 0.6)',
            'borderColor': 'rgb(127, 67, 150)',
            'borderWidth': 1,
            'borderRadius':10,
        }]
    }
    
    
   
    cores = {
    'Credito': '#4CAF50',
    'Debito': '#F44336',
    'Dinheiro': '#FF9800',
    'Pix': '#673AB7',
}

    border_cores = {
    'Credito': '#388E3C',
    'Debito': '#D32F2F',
    'Dinheiro': '#F57C00',
    'Pix': '#512DA8',
}


    formas_pagamento = ( Pagamento.objects.values('forma_pagamento')).annotate(total=Count('id'))
     
    formas_pagamento_labels = [item['forma_pagamento'].capitalize() for item in formas_pagamento]
    formas_pagamento_dados = [item['total'] for item in formas_pagamento]
    
    grafico_formas_pagamento = {
        'labels': formas_pagamento_labels,
        'datasets': [{
            'label': '',
            'data': formas_pagamento_dados,  
            'backgroundColor': [cores.get(label, '#888') for label in formas_pagamento_labels],
            'borderColor': [border_cores.get(label, '#666') for label in formas_pagamento_labels],
            'borderWidth': 1,
            'borderRadius':10,
        }]
    }
    
    context = {
        'agendamentos':agendamentos,
        'faltas_dia': faltas_dia,
        'total_pacientes_ativos':total_pacientes_ativos,
        'total_profissionais_ativos': total_profissionais_ativos,
        'agendamentos_semana':agendamentos_semana,
        'agendamentos_dia':agendamentos_dia,
        'agendamentos_dia_finalizados':agendamentos_dia_finalizados,
        'agendamentos_dia_pendentes':agendamentos_dia_pendentes,
        "chart_data": grafico_dados_7_dias,
        'evolucao_mensal_data':grafico_evolucao_mensal,
        'distribuicao_por_profissional':grafico_distribuicao_por_profissional,
        'servicos_mais_contratados':grafico_servicos_mais_contratados,
        'grafico_status_agendamentos': grafico_status_agendamentos,
        'grafico_formas_pagamento':grafico_formas_pagamento,
        'variacao_pacientes_ativos':  variacao_pacientes_ativos,
        'variacao_profissionais_ativos': variacao_profissionais_ativos,
        'variacao_agendamentos': variacao_agendamentos,
        'variacao_sessao':variacao_sessao,
        'variacao_finalizadas':variacao_finalizadas,
        'variacao_pendentes': variacao_pendentes,

    }
    return render(request, 'core/dashboard.html', context)


def alterar_status_dashboard(request, pk):
    return alterar_status_agendamento(request,pk, redirect_para='dashboard')