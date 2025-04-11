from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from .forms import LoginForm, RegisterForm
from django.contrib import messages
from django.contrib.auth.forms import AuthenticationForm
from .models import Paciente
from django.db.models import Q
from django.core.paginator import Paginator

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

def dashboard_view(request):
    return render(request, 'core/dashboard.html')

def pacientes_view(request):
    if request.method == 'POST':
        nome = request.POST.get('nome')
        cpf = request.POST.get('cpf')
        telefone = request.POST.get('telefone')
        Paciente.objects.create(nome=nome, cpf=cpf, telefone=telefone)
        return redirect('pacientes')
    
    query = request.GET.get('q','').strip()
    
    pacientes = Paciente.objects.filter(ativo=True).order_by('-id')
    
    if query in [None, '', "None"]:
        query = ''
        pacientes = pacientes.filter(Q(nome__icontains=query) | Q(cpf_icontains=query))
        
        
    paginator = Paginator(pacientes, 12)
    page_number = request.GET.get("page")
    page_obj = paginator.get_page(page_number)
    return render(request, 'core/pacientes.html', {'page_obj': page_obj, 'query': query})


def profissionais_view(request):
    return render(request, 'core/profissionais.html')

def financeiro_view(request):
    return render(request, 'core/financeiro.html')

def agendamento_view(request):
    return render(request, 'core/agendamentos.html')

def configuracao_view(request):
    return render(request, 'core/configuracoes.html')

