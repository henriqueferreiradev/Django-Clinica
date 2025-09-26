# core/services/status_beneficios.py
from django.db.models import Q

def _rank(status: str) -> int:
    # só status que dão prêmio contam no “topo já atingido”
    return {'vip': 1, 'premium': 2}.get(status, -1)

def contar_consecutivos(paciente, status, mes, ano):
    qs = paciente.historico_status.filter(
        Q(ano__lt=ano) | Q(ano=ano, mes__lte=mes)
    ).order_by('-ano', '-mes')

    count = 0
    for h in qs:
        if h.status == status:
            count += 1
        else:
            break
    return count

def calcular_beneficio(paciente, mes, ano, status):
    """
    Regras:
    1) Boas-vindas: só na primeira vez em um status que seja
       ESTRITAMENTE MAIOR que qualquer status com prêmio já atingido (VIP/Premium).
       - VIP primeiro → ganha; depois Premium → ganha.
       - Premium primeiro → ganha; depois VIP (1ª vez) → NÃO ganha.
    2) Mesmos status em meses seguintes: só ganha no 6º mês consecutivo em diante.
    3) Trocas de status:
       - Subida (ex.: VIP→Premium): boas-vindas se Premium ainda não foi atingido.
       - Queda (ex.: Premium→VIP): sem boas-vindas; só após 6 meses consecutivos no VIP.
    4) 'primeiro_mes', 'plus', 'indefinido' nunca dão prêmio.
    """
    historicos = paciente.historico_status.filter(
        Q(ano__lt=ano) | Q(ano=ano, mes__lt=mes)
    ).order_by('-ano', '-mes')

    # Sem histórico: primeira avaliação do paciente
    if not historicos.exists():
        return status in ['vip', 'premium']

    if status in ['indefinido', 'primeiro_mes', 'plus']:
        return False

    ultimo = historicos.first()

    # Maior status com prêmio já atingido no passado (VIP/Premium)
    prev_max_rank = -1
    for h in historicos:
        prev_max_rank = max(prev_max_rank, _rank(h.status))

    # Mudou de status neste mês?
    if ultimo.status != status:
        ja_teve_este_status = historicos.filter(status=status).exists()

        if not ja_teve_este_status:
            # Primeira vez neste status:
            # só há boas-vindas se este status for MAIOR que todo topo já atingido
            return _rank(status) > prev_max_rank
        else:
            # Já teve este status no passado -> só com 6 meses consecutivos
            return contar_consecutivos(paciente, status, mes, ano) >= 6

    # Manteve o mesmo status: só a partir do 6º mês consecutivo
    return contar_consecutivos(paciente, status, mes, ano) >= 6
