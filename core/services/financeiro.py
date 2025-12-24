# core/services/financeiro.py
from decimal import Decimal

 
from clinica_project.settings import TIME_ZONE
from core.models import CategoriaContasReceber, CategoriaFinanceira, Pagamento, Receita
from datetime import date, timezone

def criar_receita_pacote(paciente, pacote, valor_final, vencimento, 
                        forma_pagamento, valor_pago_inicial=None):
    """
    Cria ou atualiza UMA receita para UM pacote
    USANDO VÍNCULO DIRETO, SEM REGEX!
    """
    from decimal import Decimal
    
    if not valor_final or valor_final <= 0:
        return None
    
    # BUSCA CATEGORIA PARA PACOTES
    categoria_receita, _ = CategoriaContasReceber.objects.get_or_create(
        nome="Pacotes",
        defaults={'ativo': True}
    )
    
    # BUSCA CATEGORIA FINANCEIRA
    try:
        categoria_financeira = CategoriaFinanceira.objects.filter(
            tipo='receita'
        ).first()
    except:
        categoria_financeira = None
    
    # 🚨 A MUDANÇA CRUCIAL: update_or_create COM pacote
    receita, created = Receita.objects.update_or_create(
        pacote=pacote,  # VÍNCULO DIRETO - isso evita duplicação
        defaults={
            'paciente': paciente,
            'categoria': categoria_financeira,
            'categoria_receita': categoria_receita,
            'descricao': f'Pacote {pacote.codigo} - {pacote.servico.nome if pacote.servico else "Serviço"}',
            'valor': valor_final,
            'vencimento': vencimento,
            'forma_pagamento': forma_pagamento,
            'status': 'pendente' if valor_final > Decimal('0.00') else 'pago',
        }
    )
    
    if created:
        print(f"✅ Receita criada para pacote {pacote.codigo} (ID: {receita.id})")
    else:
        print(f"📝 Receita atualizada para pacote {pacote.codigo} (ID: {receita.id})")
    
    # Pagamento inicial (se houver e NÃO existir)
    if valor_pago_inicial and valor_pago_inicial > 0:
        # Verificar se já existe pagamento similar
        pagamento_existente = Pagamento.objects.filter(
            receita=receita,
            valor__range=(
                valor_pago_inicial - Decimal('0.01'),
                valor_pago_inicial + Decimal('0.01')
            )
        ).exists()
        
        if not pagamento_existente:
            Pagamento.objects.create(
                receita=receita,
                paciente=paciente,
                pacote=pacote,
                agendamento=None,
                valor=valor_pago_inicial,
                forma_pagamento=forma_pagamento,
                status='pago',
                vencimento=vencimento
            )
            print(f"💰 Pagamento inicial criado: R$ {valor_pago_inicial}")
            
            # Atualizar status
            receita.atualizar_status_por_pagamentos()
        else:
            print(f"⚠️ Pagamento inicial já existe para esta receita")
    
    return receita






































def criar_pagamento(*, receita, paciente, pacote, agendamento, valor, forma_pagamento, data_pagamento=None):
    if valor <= 0:
        raise ValueError('Valor inválido')

    pagamento = Pagamento.objects.create(
        receita=receita,
        paciente=paciente,
        pacote=pacote,
        agendamento=agendamento,
        valor=valor,
        forma_pagamento=forma_pagamento,
        status='pago',
        data=data_pagamento or timezone.now(),
        vencimento=receita.vencimento,
    )

    receita.atualizar_status_por_pagamentos()
    return pagamento
