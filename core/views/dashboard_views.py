from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from core.models import Paciente, Especialidade,Profissional, Servico,PacotePaciente,Agendamento,Pagamento, ESTADO_CIVIL, MIDIA_ESCOLHA, VINCULO, COR_RACA, UF_ESCOLHA,SEXO_ESCOLHA, CONSELHO_ESCOLHA
from datetime import date, datetime, timedelta
from django.utils import timezone
import json
import locale
locale.setlocale(locale.LC_TIME, 'pt_BR.UTF-8')




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
    
    seis_dias_atras = hoje - timedelta(days=5)
    agendamentos_ultimos_7_dias = Agendamento.objects.filter(data__range=(seis_dias_atras, hoje))

    dias_labels = []
    dias_dados = []
    dias_semana = ['segunda-feira', 'terça-feira', 'quarta-feira',
               'quinta-feira', 'sexta-feira', 'sábado',]
    for i in range(6):
        dia = seis_dias_atras + timedelta(days=i)
        nome_dia = dias_semana[dia.weekday()]   
        dias_labels.append(dia.strftime(f'%d/%m ({nome_dia})'))
        count = agendamentos_ultimos_7_dias.filter(data=dia).count()
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
 
 
    print(grafico_dados_7_dias)
    context = {
        'agendamentos':agendamentos,
        'total_pacientes_ativos':total_pacientes_ativos,
        'total_profissionais_ativos': total_profissionais_ativos,
        'agendamentos_semana':agendamentos_semana,
        'agendamentos_dia':agendamentos_dia,
        'agendamentos_dia_finalizados':agendamentos_dia_finalizados,
        'agendamentos_dia_pendentes':agendamentos_dia_pendentes,
        "chart_data": grafico_dados_7_dias,
    }
    return render(request, 'core/dashboard.html', context)

