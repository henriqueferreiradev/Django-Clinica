from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from .forms import LoginForm

def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('dashboard')   
    else:
        form = LoginForm()
 
    return render(request, 'core/login.html', {'form': form})

def register_form(request):
    ...
def logout_view(request):
    logout(request)
    return redirect('login')

def dashboard_view(request):
    return render(request, 'core/dashboard.html')