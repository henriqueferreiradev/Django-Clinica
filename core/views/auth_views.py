from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import login,logout
from django.contrib import messages
from django.shortcuts import render, redirect

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
