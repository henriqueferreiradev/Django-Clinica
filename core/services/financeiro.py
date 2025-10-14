# core/services/financeiro.py
from core.models import Receita, Pagamento, CategoriaFinanceira
from datetime import date

def criar_receita_pacote(paciente, pacote, valor_final, vencimento, forma_pagamento=None, valor_pago_inicial=0):
    cat, _ = CategoriaFinanceira.objects.get_or_create(nome='Pacotes de Sessões', tipo='receita')

    receita = Receita.objects.create(
        paciente=paciente,
        categoria=cat,
        descricao=f'Pacote {pacote.codigo} - {pacote.servico.nome}',
        vencimento=vencimento,
        valor=valor_final,
        status='pendente',
        forma_pagamento=None,  # título não “tem” forma ainda
    )

    # Se houve pagamento no ato (parcial ou total), registra um Pagamento e atualiza a Receita
    if valor_pago_inicial and valor_pago_inicial > 0:
        Pagamento.objects.create(
            paciente=paciente,
            pacote=pacote,
            agendamento=None,           # pode preencher depois se quiser atrelar à 1ª sessão
            valor=valor_pago_inicial,
            forma_pagamento=forma_pagamento,
            status='pago',
            vencimento=vencimento,
            receita=receita,
        )
        receita.atualizar_status_por_pagamentos()

    return receita

def registrar_pagamento(receita, paciente, pacote, agendamento, valor, forma_pagamento):
    p = Pagamento.objects.create(
        paciente=paciente,
        pacote=pacote,
        agendamento=agendamento,
        valor=valor,
        forma_pagamento=forma_pagamento,
        status='pago',
        vencimento=receita.vencimento,
        receita=receita,
    )
    receita.atualizar_status_por_pagamentos()
    return p
