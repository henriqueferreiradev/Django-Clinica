from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from .forms import LoginForm, RegisterForm
from django.contrib import messages
from django.contrib.auth.forms import AuthenticationForm

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

def register_view(request):
    ...
def logout_view(request):
    logout(request)
    return redirect('login')

def dashboard_view(request):
    return render(request, 'core/dashboard.html')

def pacientes_view(request):
    return render(request, 'core/pacientes.html')

def profissionais_view(request):
    return render(request, 'core/profissionais.html')

def financeiro_view(request):
    return render(request, 'core/ficanceiro.html')