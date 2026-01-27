from datetime import timedelta


def criar_evento_nf_pendente(receita):
    from core.models import NotaFiscalPendente, Notificacao
    from django.contrib.auth import get_user_model

    User = get_user_model()
    base = receita.ultimo_pagamento.date()
    previsao = base + timedelta(days=3)
    nf, created = NotaFiscalPendente.objects.get_or_create(
        receita=receita,
        defaults={
            'paciente': receita.paciente,
            'valor': receita.valor,
            'competencia': receita.vencimento.replace(day=1),
            'previsao_emissao': previsao,
            
        }
    )

    if not created:
        return nf  # NF já existia, não cria nada novo

    # 🔔 usuários que DEVEM receber
    usuarios_destino = User.objects.filter(
        ativo=True,
        tipo__in=['financeiro', 'admin', 'gerente']
    )

    for usuario in usuarios_destino:
        Notificacao.objects.create(
            usuario=usuario,
            paciente=receita.paciente,
            titulo='Emitir NF - ação necessária',
            mensagem=(
                'Receita quitada e o paciente solicita nota fiscal. '
                'Defina a previsão de emissão ou marque como emitida.'
            ),
            tipo='alerta',
            url=f'/financeiro/notas-fiscais/?paciente={receita.paciente.id}',
        )

    return nf
