from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import login,logout
from django.contrib import messages
from django.shortcuts import render, redirect

def dashboard(request):
 
    return render(request, 'core/administrativo/dashboard_adm.html', {
  
    })

def notas_fiscais_views(request):
    return render(request, 'core/administrativo/notas_fiscais.html')
