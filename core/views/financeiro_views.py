from datetime import date, datetime
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
from django.db.models import Sum, Q
from django.utils import timezone
from numpy import true_divide
from core.models import CategoriaContasReceber, ContaBancaria, Fornecedor, Pagamento, Receita, Despesa
from core.utils import paginate


@login_required(login_url='login')
def financeiro_view(request):
    if request.user.tipo == 'profissional':
        return HttpResponseForbidden("Acesso negado.")
    
    
    
    
    total_receitas = Pagamento.objects.aggregate(todas_receitas=(Sum('valor')))
   
    ultimos_recebimentos = Pagamento.objects.filter(status="pago").order_by('-id')[:3]
 
    for u in ultimos_recebimentos:
        print(u.paciente.nome)
    


    context = {
        'total_receitas': total_receitas,
        'ultimos_recebimentos': ultimos_recebimentos,
    }

    return render(request, 'core/financeiro/dashboard.html', context)

def fluxo_caixa_view(request):
 
    return render(request, 'core/financeiro/fluxo_caixa.html')

# views/financeiro_views.py - SUBSTITUA a função:

from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from decimal import Decimal
from django.db.models import Q, Sum
from django.core.paginator import Paginator
from django.db.models.functions import Coalesce
from datetime import date

@login_required
def contas_a_receber_view(request):
    hoje = timezone.localdate()
    
    # 🚨 SIMPLIFIQUE: Busca apenas receitas com saldo
    receitas_com_saldo = Receita.objects.filter(
        Q(status='pendente') | Q(status='atrasado')
    ).annotate(
        total_pago_calculado=Coalesce(
            Sum('pagamentos__valor', filter=Q(pagamentos__status='pago')),
            Decimal('0.00')
        )
    ).annotate(
        saldo_calculado=Coalesce('valor', Decimal('0.00')) - Coalesce('total_pago_calculado', Decimal('0.00'))
    ).filter(
        saldo_calculado__gt=Decimal('0.00')
    ).select_related('paciente', 'categoria_receita', 'pacote').order_by('vencimento')
    
    # Converter para formato da view
    lancamentos = []
    for receita in receitas_com_saldo:
        # Status
        if receita.vencimento:
            if receita.vencimento < hoje:
                status = 'Atrasado'
            elif receita.vencimento == hoje:
                status = 'Vence Hoje'
            else:
                status = 'Pendente'
        else:
            status = 'Pendente'
        
        # Tipo baseado no vínculo direto
        tipo = 'pacote_via_receita' if receita.pacote else 'receita_manual'
        
        lancamentos.append({
            'id': receita.id,
            'paciente': receita.paciente,
            'descricao': receita.descricao,
            'valor': receita.saldo_calculado,
            'valor_total': receita.valor,
            'vencimento': receita.vencimento,
            'status': status,
            'origem': 'receita',
            'total_pago': receita.total_pago_calculado,
            'tipo': tipo,
            'item_id': receita.id,
            'pacote_codigo': receita.pacote.codigo if receita.pacote else None
        })
    
    # KPIs
    total_pendente = Decimal('0')
    total_atrasado = Decimal('0')
    total_vence_hoje = Decimal('0')
    
    for lanc in lancamentos:
        if lanc['status'] == 'Atrasado':
            total_atrasado += lanc['valor']
        elif lanc['status'] == 'Vence Hoje':
            total_vence_hoje += lanc['valor']
        else:
            total_pendente += lanc['valor']
    
    total_a_receber = total_pendente + total_atrasado + total_vence_hoje
    
    # Paginação
    paginator = Paginator(lancamentos, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'total_pendente': total_pendente,
        'total_atrasado': total_atrasado,
        'total_vence_hoje': total_vence_hoje,
        'total_a_receber': total_a_receber,
        'categorias': CategoriaContasReceber.objects.filter(ativo=True),
    }
    
    return render(request, 'core/financeiro/contas_receber.html', context)








def contas_a_pagar_view(request):
    hoje = timezone.localdate()

    despesas_qs  = (Despesa.objects.select_related('fornecedor','categoria', 'conta_bancaria'))

    status = request.GET.get('status')
    fornecedor = request.GET.get('fornecedor')
    #categoria = request.GET.get('categoria')
    
    if status:
        despesas_qs = despesas_qs.filter(status=status)
    if fornecedor:
        despesas_qs = despesas_qs.filter(fornecedor__razao_social__icontains=fornecedor)
    #if categoria:
    #    despesas_qs = despesas_qs.filter(categoria=categoria)    

    despesas_qs = despesas_qs.order_by('vencimento')

    lancamentos = []
    
    for despesa in despesas_qs:
        if despesa.status == 'pago':
            status_calculado = 'Pago'
        elif despesa.status == 'agendado':
            status_calculado = 'Agendado'
        else:
            if despesa.vencimento < hoje:
                status_calculado = "Atrasado"
            elif despesa.vencimento == hoje:
                status_calculado = 'Vence Hoje'
            else:
                status_calculado = 'Pendente'
    

        lancamentos.append({
            'id':despesa.id,
            'fornecedor':despesa.razao_social,
            'categoria':despesa.categoria,
            'valor': despesa.valor,
            'vencimento':despesa.vencimento,
            'status': despesa.status,
            'status_calculado': status_calculado,
            'item_id':despesa.id,
            }

        )


    total_atrasado = Decimal('0')
    total_vence_hoje = Decimal('0')
    total_pendente = Decimal('0')
    total_agendado = Decimal('0')

    for despesa in despesas_qs.exclude(status='pago'):
        if despesa.status == 'agendado':
            total_agendado += despesa.valor
        elif despesa.vencimento < hoje:
            total_atrasado += despesa.valor
        elif despesa.vencimento == hoje:
            total_vence_hoje += despesa.valor
        else:
            total_pendente +=despesa.valor

    
    total_a_pagar = (
        total_atrasado + total_vence_hoje + total_pendente + total_agendado
    )

    page_obj = paginate(request, lancamentos, per_page=10)



    fornecedores = Fornecedor.objects.filter(ativo=True)
    contas_bancarias = ContaBancaria.objects.filter(ativo=True)
    
    context = {
        'page_obj':page_obj,
        'fornecedores':fornecedores,
        'contas_bancarias':contas_bancarias,
        'total_atrasado':total_atrasado,
        'total_vence_hoje':total_vence_hoje,
        'total_a_pagar':total_a_pagar,
        'total_pendente':total_pendente,
        'total_agendado':total_agendado, 
    }
    
    return render(request, 'core/financeiro/contas_pagar.html', context)

    
def faturamento_view(request):
 
    return render(request, 'core/financeiro/faturamento.html')

def folha_pagamento_view(request):
    return render(request, 'core/financeiro/folha_pagamento.html')

def relatorios_view(request):
    return render(request, 'core/financeiro/relatorios.html')