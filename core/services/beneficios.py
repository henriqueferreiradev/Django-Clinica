from datetime import date, datetime, timedelta
from django.conf import settings
from django.forms import ValidationError
 
from core.models import HistoricoStatus, UsoBeneficio, ValidadeBeneficios
from django.utils import timezone

def calcular_validade_beneficio(mes: int, ano: int, tipo_beneficio: str) -> date:
    """
    Calcula validade: conta 90 dias INCLUINDO o dia 1º do mês.
    Ex: 01/jan (dia 1) + 89 dias = 90 dias totais.
    """
    try:
        config = ValidadeBeneficios.objects.get(
            tipo_beneficio=tipo_beneficio,
            ativo=True
        )
        dias_config = config.dias_validade  # 90
    except ValidadeBeneficios.DoesNotExist:
        dias_config = 90 if tipo_beneficio == 'beneficio' else 30
    
    # Data de início: 1º dia do mês
    data_inicio = date(ano, mes, 1)
    
    # Subtrair 1 porque o primeiro dia já conta como "dia 1"
    dias_para_adicionar = dias_config - 1
    
    return data_inicio + timedelta(days=dias_para_adicionar)
def anos_da_empresa(hoje=None):
    hoje = hoje or date.today()
    fund = getattr(settings, 'EMPRESA_DATA_FUNDACAO', date(2016, 5, 15))
    anos = hoje.year - fund.year - ((hoje.month, hoje.day) < (fund.month, fund.day))
    return max(0, anos)

def desconto_vip():
    return 5

def desconto_premium():
    # base 8% e aumenta 1pp por ano da empresa
    return max(8, anos_da_empresa())

def beneficios_do_status(paciente, status: str, mes: int, ano: int):
    """
    Retorna benefícios considerando status E aniversário.
    """
    beneficios = []
    
    # Benefícios normais do status
    if status == 'vip':
        beneficios.extend([
            {'tipo': 'relaxante', 'titulo': '1 sessão relaxante', 'origem': 'status'},
            {'tipo': 'desconto', 'titulo': f'{desconto_vip()}% de desconto', 'percentual': desconto_vip(), 'origem': 'status'},
            {'tipo': 'brinde', 'titulo': 'Brinde', 'origem': 'status'},
        ])
    elif status == 'premium':
        beneficios.extend([
            {'tipo': 'sessao_livre', 'titulo': '1 sessão livre', 'origem': 'status'},
            {'tipo': 'desconto', 'titulo': f'{desconto_premium()}% de desconto', 'percentual': desconto_premium(), 'origem': 'status'},
            {'tipo': 'brinde', 'titulo': 'Brinde', 'origem': 'status'},
        ])
    
    # BENEFÍCIO DE ANIVERSÁRIO (se aplica)
    if paciente.data_nascimento and paciente.data_nascimento.month == mes:
        beneficios.append({
            'tipo': 'sessao_aniversario',
            'titulo': 'Benefício de Aniversário 🎂',
            'origem': 'aniversario',
             
        })
    
    return beneficios

def beneficios_disponiveis(paciente, mes, ano):
    try:
        hist = HistoricoStatus.objects.get(paciente=paciente, mes=mes, ano=ano)
        status = hist.status
        ganhou_status = hist.ganhou_beneficio
    except HistoricoStatus.DoesNotExist:
        status = None
        ganhou_status = False
    
    # Pegar benefícios (mesmo sem status, pode ter aniversário)
    base = beneficios_do_status(paciente, status, mes, ano) if status else []
    
    # Filtrar: se não ganhou benefício do status, remove apenas os de origem 'status'
    if not ganhou_status:
        base = [b for b in base if b.get('origem') != 'status']
    
    # Se não tem benefícios nem de aniversário
    if not base:
        return {'tem_beneficio': False, 'beneficios': []}
    
    # Verificar usos
    usados = set(
        UsoBeneficio.objects.filter(paciente=paciente, mes=mes, ano=ano)
        .values_list('tipo', flat=True)
    )
    
    for b in base:
        b['usado'] = b['tipo'] in usados
        
        # Calcular validade baseado na origem
        if b.get('origem') == 'aniversario':
            b['valido_ate'] = calcular_validade_beneficio(mes, ano, 'aniversario')
        else:
            b['valido_ate'] = calcular_validade_beneficio(mes, ano, 'beneficio')
        
        b['esta_valido'] = date.today() <= b['valido_ate']
    
    return {
        'tem_beneficio': True,
        'status': status,
        'beneficios': base,
        'tem_aniversario': any(b.get('origem') == 'aniversario' for b in base)
    }
from django.db import transaction
def usar_beneficio(*, paciente, mes, ano, tipo, usuario=None, agendamento=None, valor_desconto=None):
    # 1. Buscar histórico
    hist = HistoricoStatus.objects.select_for_update().get(paciente=paciente, mes=mes, ano=ano)
    
    if not hist.ganhou_beneficio:
        raise ValueError("Paciente não possui benefício neste mês.")
    
    # 2. Verificar se já existe uso
    if UsoBeneficio.objects.filter(paciente=paciente, mes=mes, ano=ano, tipo=tipo).exists():
        raise ValueError("Benefício já utilizado neste mês.")
    
    # 3. NOVA VALIDAÇÃO: Verificar validade
    valido_ate = calcular_validade_beneficio(mes, ano, 'beneficio')
    if timezone.now().date() > valido_ate:
        raise ValidationError(f"Benefício expirou em {valido_ate.strftime('%d/%m/%Y')}.")
    
    # 4. Validações específicas do tipo
    if tipo in ('relaxante', 'sessao_livre') and agendamento is None:
        raise ValueError("Informe o agendamento ao usar uma sessão.")
    if tipo == 'desconto' and valor_desconto is None:
        raise ValueError("Informe o valor do desconto aplicado.")
    
    # 5. Criar registro com data de validade
    with transaction.atomic():
        return UsoBeneficio.objects.create(
            paciente=paciente, 
            mes=mes, 
            ano=ano, 
            status_no_mes=hist.status,
            tipo=tipo, 
            agendamento=agendamento, 
            valor_desconto_aplicado=valor_desconto,
            usado_por=usuario,
            # ADICIONAR CAMPO DE VALIDADE (se seu modelo tiver)
            valido_ate=valido_ate  # ← Supondo que adicionou esse campo
        )