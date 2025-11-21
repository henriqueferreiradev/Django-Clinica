from datetime import date, datetime
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
from django.db.models import Sum, Q
from django.utils import timezone
from core.models import Pagamento, Receita, Despesa



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

    # ---- PAGAMENTOS EM ABERTO ----
    pagamentos = (
        Pagamento.objects
        .select_related('paciente', 'agendamento', 'pacote', 'receita')
        .exclude(status='pago')
        .order_by('vencimento')
    )


    # ---- CARREGA PACOTES + SESSÕES ----
    agqs = Agendamento.objects.filter(
        status__in=['agendado', 'finalizado', 'desistencia_remarcacao', 'falta_remarcacao', 'falta_cobrada']
    ).order_by('data', 'hora_inicio', 'id')

    pacotes_todos = (
        PacotePaciente.objects
        .select_related('paciente', 'servico', 'profissional')
        .prefetch_related(Prefetch('agendamento_set', queryset=agqs, to_attr='agds'))
        .filter(ativo=True)
    )

    pacotes_pendentes = [p for p in pacotes_todos if p.valor_restante and p.valor_restante > Decimal('0.00')]
    # ---- KPIs ----
    total_pendente = Pagamento.objects.filter(status='pendente').aggregate(total=Sum('valor'))['total'] or Decimal('0')
    total_atrasado = Pagamento.objects.filter(
        Q(status='atrasado') | Q(vencimento__lt=hoje),
        ~Q(status='pago')
    ).aggregate(total=Sum('valor'))['total'] or Decimal('0')
    total_vence_hoje = Pagamento.objects.filter(vencimento=hoje, status='pendente').aggregate(total=Sum('valor'))['total'] or Decimal('0')

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

    total_pendente += saldo_pacotes
    total_atrasado += saldo_pacotes_atrasados
    total_vence_hoje += saldo_pacotes_hoje
    total_a_receber = total_pendente + total_atrasado + total_vence_hoje

    # ---- MONTAGEM DOS LANÇAMENTOS ----
    lancamentos = []
    
    for p in pagamentos:
        if p.vencimento:
            if p.vencimento < hoje:
                status_calc = 'Atrasado'
            elif p.vencimento == hoje:
                status_calc = 'Vence Hoje'
            else:
                status_calc = 'Pendente'
        else:
            status_calc = 'Pendente'

        # BUSCAR RECEITA PARA PAGAMENTOS
        receita_id = None
        
        # 1. Se já tem receita vinculada
        if p.receita:
            receita_id = p.receita.id
            
        # 2. Se é pagamento de pacote, buscar receita do pacote
        elif p.pacote:
            receita_pacote = Receita.objects.filter(
                paciente=p.paciente,
                descricao__icontains=p.pacote.codigo
            ).first()
            if receita_pacote:
                receita_id = receita_pacote.id
                # Atualiza o pagamento com a receita encontrada
                p.receita = receita_pacote
                p.save()

        lancamentos.append({
            'tipo': 'pagamento',
            'id': receita_id,
            'paciente': p.paciente,
            'descricao': p.descricao or (p.agendamento and f"Sessão {p.agendamento.id}") or 'Pagamento',
            'valor': p.valor,
            'vencimento': p.vencimento,
            'status': status_calc,
        })

    for pac in pacotes_pendentes:
        primeira_sessao = pac.agds[0] if getattr(pac, 'agds', []) else None
        venc = primeira_sessao.data if primeira_sessao else pac.data_inicio
        saldo = Decimal(str(pac.valor_restante))

        if venc < hoje:
            status_calc = 'Atrasado'
        elif venc == hoje:
            status_calc = 'Vence Hoje'
        else:
            status_calc = 'Pendente'

        # BUSCAR RECEITA DO PACOTE (AGORA FUNCIONA!)
        receita_pacote = Receita.objects.filter(
            paciente=pac.paciente,
            descricao__icontains=pac.codigo  # Busca pelo código do pacote
        ).first()
        
        receita_id = receita_pacote.id if receita_pacote else None

        lancamentos.append({
            'tipo': 'pacote',
            'id': receita_id,  # Agora vai encontrar a receita!
            'paciente': pac.paciente,
            'descricao': f"Pacote {pac.codigo} ({pac.servico.nome if pac.servico else '—'})",
            'valor': saldo,
            'vencimento': venc,
            'status': status_calc,
        })

    lancamentos.sort(key=lambda x: x['vencimento'] or date(9999, 12, 31))
 
    # ---- PAGINAÇÃO ----
    paginator = Paginator(lancamentos,10)   
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {
        'page_obj': page_obj,
        'total_pendente': f"R$ {total_a_receber:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.'),
        'total_atrasado': f"R$ {total_atrasado:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.'),
        'total_vence_hoje': f"R$ {total_vence_hoje:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.'),
    }

    return render(request, 'core/financeiro/contas_receber.html', context)

def contas_a_pagar_view(request):
 
    return render(request, 'core/financeiro/contas_pagar.html')

    
def faturamento_view(request):
 
    return render(request, 'core/financeiro/faturamento.html')

def folha_pagamento_view(request):
    return render(request, 'core/financeiro/folha_pagamento.html')

def relatorios_view(request):
    return render(request, 'core/financeiro/relatorios.html')