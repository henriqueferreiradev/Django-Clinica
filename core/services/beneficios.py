from datetime import date
from django.conf import settings
from core.models import HistoricoStatus, UsoBeneficio

def anos_da_empresa(hoje=None):
    hoje = hoje or date.today()
    fund = getattr(settings, 'EMPRESA_DATA_FUNDACAO', date(2016, 1, 1))
    anos = hoje.year - fund.year - ((hoje.month, hoje.day) < (fund.month, fund.day))
    return max(0, anos)

def desconto_vip():
    return 5

def desconto_premium():
    # base 8% e aumenta 1pp por ano da empresa
    return max(8, anos_da_empresa())

def beneficios_do_status(status: str):
    if status == 'vip':
        return [
            {'tipo': 'relaxante', 'titulo': '1 sessão relaxante'},
            {'tipo': 'desconto', 'titulo': f'{desconto_vip()}% de desconto em um pagamento', 'percentual': desconto_vip()},
            {'tipo': 'brinde', 'titulo': 'Brinde'},
        ]
    if status == 'premium':
        return [
            {'tipo': 'sessao_livre', 'titulo': '1 sessão livre'},
            {'tipo': 'desconto', 'titulo': f'{desconto_premium()}% de desconto em um pagamento', 'percentual': desconto_premium()},
            {'tipo': 'brinde', 'titulo': 'Brinde'},
        ]
    return []

def beneficios_disponiveis(paciente, mes, ano):
    try:
        hist = HistoricoStatus.objects.get(paciente=paciente, mes=mes, ano=ano)
    except HistoricoStatus.DoesNotExist:
        return {'tem_beneficio': False, 'beneficios': []}

    if not hist.ganhou_beneficio:
        return {'tem_beneficio': False, 'beneficios': []}

    base = beneficios_do_status(hist.status)
    usados = set(
        UsoBeneficio.objects.filter(paciente=paciente, mes=mes, ano=ano)
        .values_list('tipo', flat=True)
    )
    for b in base:
        b['usado'] = b['tipo'] in usados
    return {'tem_beneficio': True, 'status': hist.status, 'beneficios': base}

from django.db import transaction
def usar_beneficio(*, paciente, mes, ano, tipo, usuario=None, agendamento=None, valor_desconto=None):
    hist = HistoricoStatus.objects.select_for_update().get(paciente=paciente, mes=mes, ano=ano)
    if not hist.ganhou_beneficio:
        raise ValueError("Paciente não possui benefício neste mês.")
    if UsoBeneficio.objects.filter(paciente=paciente, mes=mes, ano=ano, tipo=tipo).exists():
        raise ValueError("Benefício já utilizado neste mês.")

    if tipo in ('relaxante', 'sessao_livre') and agendamento is None:
        raise ValueError("Informe o agendamento ao usar uma sessão.")
    if tipo == 'desconto' and valor_desconto is None:
        raise ValueError("Informe o valor do desconto aplicado.")

    with transaction.atomic():
        return UsoBeneficio.objects.create(
            paciente=paciente, mes=mes, ano=ano, status_no_mes=hist.status,
            tipo=tipo, agendamento=agendamento, valor_desconto_aplicado=valor_desconto,
            usado_por=usuario
        )
