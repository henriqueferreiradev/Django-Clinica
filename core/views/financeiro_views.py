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
    print(total_receitas)

    


    context = {
        'total_receitas': total_receitas,
    }

    return render(request, 'core/financeiro/dashboard.html', context)

def fluxo_caixa_view(request):
 
    return render(request, 'core/financeiro/fluxo_caixa.html')
from django.db.models import Sum, Q, Prefetch
from django.utils import timezone
from datetime import date
from decimal import Decimal
from core.models import Pagamento, PacotePaciente, Agendamento
def contas_a_receber_view(request):
    hoje = timezone.localdate()

    # ---- PAGAMENTOS EM ABERTO ----
    pagamentos = (
        Pagamento.objects
        .select_related('paciente', 'agendamento', 'pacote')
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

    # Filtra pacotes com saldo > 0
    pacotes_pendentes = [p for p in pacotes_todos if p.valor_restante and p.valor_restante > Decimal('0.00')]

    # ---- KPIs BASEADOS EM PAGAMENTOS ----
    total_pendente = Pagamento.objects.filter(status='pendente').aggregate(total=Sum('valor'))['total'] or Decimal('0')
    total_atrasado = Pagamento.objects.filter(
        Q(status='atrasado') | Q(vencimento__lt=hoje),
        ~Q(status='pago')
    ).aggregate(total=Sum('valor'))['total'] or Decimal('0')
    total_vence_hoje = Pagamento.objects.filter(vencimento=hoje, status='pendente').aggregate(total=Sum('valor'))['total'] or Decimal('0')

    # ---- SOMA OS PACOTES COM SALDO RESTANTE ----
    saldo_pacotes = Decimal('0')
    saldo_pacotes_atrasados = Decimal('0')
    saldo_pacotes_hoje = Decimal('0')

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

    # Pagamentos
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

        lancamentos.append({
            'tipo': 'pagamento',
            'paciente': p.paciente,
            'descricao': p.descricao or (p.agendamento and f"Sessão {p.agendamento.id}") or 'Pagamento',
            'valor': p.valor,
            'vencimento': p.vencimento,
            'status': status_calc,
            'pacote': p.pacote,
            'agendamento': p.agendamento,
        })

    # Pacotes com saldo
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

        lancamentos.append({
            'tipo': 'pacote',
            'paciente': pac.paciente,
            'descricao': f"Pacote {pac.codigo} ({pac.servico.nome if pac.servico else '—'})",
            'valor': saldo,
            'vencimento': venc,
            'status': status_calc,
            'pacote': pac,
            'agendamento': primeira_sessao,
        })

    lancamentos.sort(key=lambda x: x['vencimento'] or date(9999, 12, 31))

    # ---- CONTEXTO ----
    context = {
        'lancamentos': lancamentos,
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