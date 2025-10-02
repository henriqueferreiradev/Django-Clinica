from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
from django.db.models import Sum
from core.models import Pagamento, Receita, Despesa
@login_required(login_url='login')
def financeiro_view(request):
    if request.user.tipo == 'profissional':
        return HttpResponseForbidden("Acesso negado.")
    

    total_receitas = Pagamento.objects.aggregate(todas_receitas=(Sum('valor')))
    print(total_receitas)

    


    context = {
        'total_receitas': total_receitas,
    }

    return render(request, 'core/financeiro/dashboard.html', context)

def fluxo_caixa_view(request):
 
    return render(request, 'core/financeiro/fluxo_caixa.html')

def contas_a_receber_view(request):
 
    return render(request, 'core/financeiro/contas_receber.html')


def contas_a_pagar_view(request):
 
    return render(request, 'core/financeiro/contas_pagar.html')

    
def faturamento_view(request):
 
    return render(request, 'core/financeiro/faturamento.html')

def folha_pagamento_view(request):
    return render(request, 'core/financeiro/folha_pagamento.html')

def relatorios_view(request):
    return render(request, 'core/financeiro/relatorios.html')