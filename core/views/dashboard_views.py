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


locale.setlocale(locale.LC_TIME, 'pt_BR.UTF-8')


DIAS_SEMANA = ['segunda-feira', 'terça-feira', 'quarta-feira',
               'quinta-feira', 'sexta-feira', 'sábado','Domingo']

NOMES_MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
               'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
FINALIZADOS = ['finalizado','desistencia','desistencia_remarcacao','falta_remarcacao','falta_cobrada']
PENDENTES = ['pre','agendado']
@login_required(login_url='login')
def dashboard_view(request):
    agendamentos = Agendamento.objects.filter(data=date.today()).select_related('especialidade')
    total_pacientes_ativos = Paciente.objects.filter(ativo=True).count()
    total_profissionais_ativos = Profissional.objects.filter(ativo=True).count()

    hoje = timezone.now().date()
    inicio_semana = hoje - timedelta(days=hoje.weekday())
    fim_semana = inicio_semana + timedelta(days=6)
    agendamentos_semana = Agendamento.objects.filter(data__gte=inicio_semana, data__lte=fim_semana).count()
    agendamentos_dia = Agendamento.objects.filter(data=date.today()).count()
    agendamentos_dia_finalizados = Agendamento.objects.filter(data=date.today(), status__in=FINALIZADOS).count()
    agendamentos_dia_pendentes = Agendamento.objects.filter(data=date.today(), status__in=PENDENTES).count()
    print(total_pacientes_ativos, agendamentos_semana)
    
    sete_dias_atras = hoje - timedelta(days=5)
    agendamentos_ultimos_6_dias = Agendamento.objects.filter(data__range=(sete_dias_atras, hoje))

    dias_labels = []
    dias_dados = []

    for i in range(7):
        dia = sete_dias_atras + timedelta(days=i)
        nome_dia = DIAS_SEMANA[dia.weekday()].capitalize()
        dias_labels.append(dia.strftime(f'%d/%m '))
        count = agendamentos_ultimos_6_dias.filter(data=dia).count()
        dias_dados.append(count)
        print(dias_labels)
 
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
            'label':'Agendamentos por mês',
            'data':meses_dados,
            'backgroundColor': 'rgba(127, 67, 150, 0.6)',
            'borderColor': 'rgb(127, 67, 150)',
            'borderWidth': 1,
            'borderRadius':10,
        }] 
    }

    distribuicao_por_profissional = (
        Agendamento.objects.values('profissional_1__nome').annotate(total=Count('id')).order_by('-total')
    )

    profissionais_labels = [item['profissional_1__nome'] for item in distribuicao_por_profissional]
    dados_profissionais = [item['total'] for item in distribuicao_por_profissional]
    cores = [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)',
        'rgba(201, 203, 207, 0.6)',
        'rgba(0, 200, 83, 0.6)',
        'rgba(255, 87, 34, 0.6)',
        'rgba(33, 150, 243, 0.6)',
    ]
    total = len(profissionais_labels)
    cores_usadas = (cores * ((total // len(cores)) + 1))[:total]
    grafico_distribuicao_por_profissional = {
        'labels': profissionais_labels,
        'datasets': [{
            'label':'Agendamentos no mês',
            'data':dados_profissionais,
            'backgroundColor': cores_usadas,
            'borderColor': ['white'] * total,
            'borderWidth': 1,
          
        }] 
    }
    print(profissionais_labels, dados_profissionais)
    context = {
        'agendamentos':agendamentos,
        'total_pacientes_ativos':total_pacientes_ativos,
        'total_profissionais_ativos': total_profissionais_ativos,
        'agendamentos_semana':agendamentos_semana,
        'agendamentos_dia':agendamentos_dia,
        'agendamentos_dia_finalizados':agendamentos_dia_finalizados,
        'agendamentos_dia_pendentes':agendamentos_dia_pendentes,
        "chart_data": grafico_dados_7_dias,
        'evolucao_mensal_data':grafico_evolucao_mensal,
        'distribuicao_por_profissional':grafico_distribuicao_por_profissional,
    }
    return render(request, 'core/dashboard.html', context)


def alterar_status_dashboard(request, pk):
    return alterar_status_agendamento(request,pk, redirect_para='dashboard')