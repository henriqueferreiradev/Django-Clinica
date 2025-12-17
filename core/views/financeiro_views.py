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
from django.db.models import Sum, Q, Prefetch
from django.utils import timezone
from datetime import date
from decimal import Decimal
from core.models import Pagamento, PacotePaciente, Agendamento
from django.core.paginator import Paginator
from django.utils import timezone
from django.db.models import Q, Sum
from decimal import Decimal
from datetime import date

def contas_a_receber_view(request):
    hoje = timezone.localdate()

    receitas_pendentes = (
        Receita.objects
        .select_related('paciente', 'categoria_receita')
        .filter(
            Q(status='pendente') | Q(status='atrasado'),
            paciente__isnull=False,
          
        )
        .order_by('vencimento')
    )

    receitas_com_saldo = []
    for receita in receitas_pendentes:
        if receita.saldo > Decimal('0.00'):
            receitas_com_saldo.append(receita)

    agqs = Agendamento.objects.filter(
        status__in=['agendado', 'finalizado', 'desistencia_remarcacao', 
                    'falta_remarcacao', 'falta_cobrada']
    ).order_by('data', 'hora_inicio', 'id')

    pacotes_todos = (
        PacotePaciente.objects
        .select_related('paciente', 'servico', 'profissional')
        .prefetch_related(Prefetch('agendamento_set', queryset=agqs, to_attr='agds'))
        .filter(ativo=True)
    )

    categorias = CategoriaContasReceber.objects.filter(ativo=True)

    pacotes_pendentes = []
    for pac in pacotes_todos:
        if pac.valor_restante > Decimal('0.00'):
            # Verifica se já existe uma receita para este pacote
            # Busca tanto pelo formato "Pacote PACXXX" quanto "Pacote PACXXX - Descrição"
            receita_existente = Receita.objects.filter(
                descricao__iregex=r'Pacote\s+' + pac.codigo,
                paciente=pac.paciente
            ).exists()
            
            # Só adiciona se NÃO tiver receita criada
            if not receita_existente:
                pacotes_pendentes.append(pac)

    # ---- MONTAGEM DOS LANÇAMENTOS PARA O TEMPLATE ----
    lancamentos = []

    # 1. TODAS AS RECEITAS PENDENTES (manuais + pacotes)
    for receita in receitas_com_saldo:
        if receita.vencimento:
            if receita.vencimento < hoje:
                status = 'Atrasado'
                status_calculado = 'Atrasado'
            elif receita.vencimento == hoje:
                status = 'Vence Hoje'
                status_calculado = 'Vence Hoje'
            else:
                status = 'Pendente'
                status_calculado = 'Pendente'
        else:
            status = 'Pendente'
            status_calculado = 'Pendente'

        # Determina o tipo baseado na descrição
        import re
        if re.search(r'Pacote\s+[A-Z0-9]{9}', receita.descricao):
            tipo = 'pacote_via_receita'
        else:
            tipo = 'receita_manual'
        
        lancamentos.append({
            'id': receita.id,
            'paciente': receita.paciente,
            'descricao': receita.descricao,
            'valor': receita.saldo,
            'valor_total': receita.valor,
            'vencimento': receita.vencimento,
            'status': status,
            'status_calculado': status_calculado,
            'origem': 'receita',
            'total_pago': receita.total_pago,
            'tipo': tipo,
            'item_id': receita.id
        })

    # 2. PACOTES PENDENTES DIRETOS (sem receita criada)
    for pac in pacotes_pendentes:
        primeira_sessao = pac.agds[0] if getattr(pac, 'agds', []) else None
        venc = primeira_sessao.data if primeira_sessao else pac.data_inicio
        saldo = Decimal(str(pac.valor_restante))

        if venc < hoje:
            status = 'Atrasado'
            status_calculado = 'Atrasado'
        elif venc == hoje:
            status = 'Vence Hoje'
            status_calculado = 'Vence Hoje'
        else:
            status = 'Pendente'
            status_calculado = 'Pendente'

        lancamentos.append({
            'id': pac.id,
            'paciente': pac.paciente,
            'descricao': f"Pacote {pac.codigo}",
            'valor': saldo,
            'valor_total': pac.valor_final,
            'vencimento': venc,
            'status': status,
            'status_calculado': status_calculado,
            'origem': 'pacote_direto',
            'total_pago': pac.total_pago,
            'tipo': 'pacote_direto',
            'item_id': pac.id,
            'pacote_codigo': pac.codigo
        })

    # Ordena por vencimento
    lancamentos.sort(key=lambda x: x['vencimento'] or date(9999, 12, 31))

    # ---- KPIs ----
    # Receitas pendentes
    total_pendente_rec = Decimal('0')
    total_atrasado_rec = Decimal('0')
    total_vence_hoje_rec = Decimal('0')
    
    for receita in receitas_com_saldo:
        saldo = receita.saldo
        if receita.vencimento < hoje:
            total_atrasado_rec += saldo
        elif receita.vencimento == hoje:
            total_vence_hoje_rec += saldo
        else:
            total_pendente_rec += saldo

    # Pacotes pendentes
    saldo_pacotes = saldo_pacotes_atrasados = saldo_pacotes_hoje = Decimal('0')
    for pac in pacotes_pendentes:
        primeira_sessao = pac.agds[0] if getattr(pac, 'agds', []) else None
        venc = primeira_sessao.data if primeira_sessao else pac.data_inicio
        saldo = Decimal(str(pac.valor_restante))

        if venc < hoje:
            saldo_pacotes_atrasados += saldo
        elif venc == hoje:
            saldo_pacotes_hoje += saldo
        else:
            saldo_pacotes += saldo

    pagamentos_hoje = Pagamento.objects.filter(data=hoje)
    print(pagamentos_hoje)

    # Totais
    total_pendente = total_pendente_rec + saldo_pacotes
    total_atrasado = total_atrasado_rec + saldo_pacotes_atrasados
    total_vence_hoje = total_vence_hoje_rec + saldo_pacotes_hoje
    total_a_receber = total_pendente + total_atrasado + total_vence_hoje



    # ---- PAGINAÇÃO ----
    paginator = Paginator(lancamentos, 10)   
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {
        'page_obj': page_obj,
        'total_pendente': f"R$ {total_pendente:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.'),
        'total_atrasado': f"R$ {total_atrasado:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.'),
        'total_vence_hoje': f"R$ {total_vence_hoje:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.'),
        'total_a_receber': f"R$ {total_a_receber:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.'),
        'categorias': categorias,
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