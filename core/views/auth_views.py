from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout
from django.http import JsonResponse
from forms import LoginForm, RegisterForm
from django.contrib import messages
from django.contrib.auth.forms import AuthenticationForm
from models import Paciente, Especialidade,Profissional, ESTADO_CIVIL, MIDIA_ESCOLHA, VINCULO, COR_RACA, UF_ESCOLHA,SEXO_ESCOLHA, CONSELHO_ESCOLHA
from django.db.models import Q
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.views.decorators.csrf import csrf_exempt 
from django.views.decorators.http import require_GET
from django.contrib.auth.decorators import login_required
from datetime import date, datetime, timedelta
from django.utils import timezone
from dateutil.relativedelta import relativedelta


def login_view(request):
    login_form = AuthenticationForm(request, data=request.POST or None)
    register_form = RegisterForm(request.POST or None)

    if request.method == 'POST':
        if 'register' in request.POST:
            if register_form.is_valid():
                register_form.save()
                messages.success(request, "Usuário registrado com sucesso!")
                return redirect('login')
        else:
            if login_form.is_valid():
                login(request, login_form.get_user())
                return redirect('dashboard')

    return render(request, 'core/login.html', {
        'form': login_form,
        'register_form': register_form
    })

def logout_view(request):
    logout(request)
    return redirect('login')


@login_required(login_url='login')
def dashboard_view(request):
    return render(request, 'core/dashboard.html')