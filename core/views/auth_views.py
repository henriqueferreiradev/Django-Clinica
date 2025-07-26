from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import login,logout
from django.contrib import messages
<<<<<<< HEAD
from django.http import HttpResponse
from django.core.management import call_command
from django.contrib.auth import get_user_model

def setup(request):
    call_command('migrate')
=======
from django.shortcuts import render, redirect
>>>>>>> main

    User = get_user_model()
    if not User.objects.filter(username="henri").exists():
        User.objects.create_superuser("henri", "henriquef501@gmail.com", "5224")

    return HttpResponse("Migração e superuser criados!")
def login_view(request):
    form = AuthenticationForm(request, data=request.POST or None)

    if request.method == 'POST':
        if form.is_valid():
            login(request, form.get_user())
            return redirect('dashboard')
        else:
            messages.error(request, "Usuário ou senha inválidos.")

    return render(request, 'core/login.html', {
        'form': form,
    })

def logout_view(request):
    logout(request)
    return redirect('login')
