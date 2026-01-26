from multiprocessing import context
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import login,logout
from django.contrib import messages
from django.shortcuts import render, redirect

from core.models import NotaFiscalPendente

def dashboard(request):
 
    return render(request, 'core/administrativo/dashboard_adm.html', {
  
    })

def notas_fiscais_views(request):
    nf_pendente_count = NotaFiscalPendente.objects.filter(status='pendente').count()
    nf_pendente_lista = NotaFiscalPendente.objects.select_related('paciente') 
    print(nf_pendente_lista)
    for nota in nf_pendente_lista:
        print()
    context = {
        'nf_pendente_count':nf_pendente_count,
        'nf_pendente_lista':nf_pendente_lista,
        }

    return render(request, 'core/administrativo/notas_fiscais.html', context)
