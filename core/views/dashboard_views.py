from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from core.models import Paciente, Especialidade,Profissional, Servico,PacotePaciente,Agendamento,Pagamento, ESTADO_CIVIL, MIDIA_ESCOLHA, VINCULO, COR_RACA, UF_ESCOLHA,SEXO_ESCOLHA, CONSELHO_ESCOLHA
from datetime import date, datetime, timedelta


@login_required(login_url='login')
def dashboard_view(request):
    agendamentos = Agendamento.objects.filter(data=date.today()).select_related('especialidade')

    context = {
        'agendamentos':agendamentos,
    }
    return render(request, 'core/dashboard.html', context)

