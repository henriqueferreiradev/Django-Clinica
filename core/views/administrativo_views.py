from datetime import datetime
from multiprocessing import context
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import login,logout
from django.contrib import messages
from django.shortcuts import render, redirect
from django.db.models import Sum
from django.http import JsonResponse
from core.models import NotaFiscalPendente

def dashboard(request):
 
    return render(request, 'core/administrativo/dashboard_adm.html', {
  
    })

def notas_fiscais_views(request):
    nf_pendente_count = NotaFiscalPendente.objects.filter(status='pendente').count()
    nf_pendente_lista = NotaFiscalPendente.objects.select_related('paciente')
    nf_pendente_soma  = NotaFiscalPendente.objects.filter(status='pendente').aggregate(total=Sum('valor'))['total'] or 0

    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        tipo = request.POST.get('tipo')
        
        if tipo == 'editar_nota':
            nota_fiscal_id = request.POST.get('nota_id')
            previsao_emissao = request.POST.get('previsao_emissao')
            print(nota_fiscal_id, previsao_emissao)
            try:
                nota_fiscal = NotaFiscalPendente.objects.get(id=nota_fiscal_id)
                previsao_emissao_str = request.POST.get('previsao_emissao')
                nota_fiscal.previsao_emissao = datetime.strptime(
                previsao_emissao_str, '%Y-%m-%d'
                ).date()
                nota_fiscal.save()
                
                return JsonResponse({'success': True})
            except Exception as e:
                return JsonResponse({'success': False, 'error': str(e)})

    print(nf_pendente_lista)
    for nota in nf_pendente_lista:
        print()
        
        
    context = {
        'nf_pendente_count':nf_pendente_count,
        'nf_pendente_lista':nf_pendente_lista,
        'nf_pendente_soma':nf_pendente_soma,
        }

    return render(request, 'core/administrativo/notas_fiscais.html', context)
