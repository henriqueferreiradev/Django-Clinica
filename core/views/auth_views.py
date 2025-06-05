from core.forms import LoginForm, RegisterForm
from django.contrib.auth.forms import AuthenticationForm
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout
from django.contrib import messages
from django.http import HttpResponse
from django.core.management import call_command
from django.contrib.auth import get_user_model

def setup(request):
    call_command('migrate')

    User = get_user_model()
    if not User.objects.filter(username="henri").exists():
        User.objects.create_superuser("henri", "henriquef501@gmail.com", "5224")

    return HttpResponse("Migração e superuser criados!")
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
