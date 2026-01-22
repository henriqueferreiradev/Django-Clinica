from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Paciente, Pagamento, Profissional
from .utils import criar_pasta_foto_paciente, criar_pasta_foto_profissional
import os
from core.views.agendamento_views import atualizar_contagem_pacote
from core.services.fiscal import criar_evento_nf_pendente

@receiver(post_save, sender=Paciente)
def criar_pasta_ao_criar_paciente(sender, instance, created, **kwargs):
    if created:
        criar_pasta_foto_paciente(instance.id,instance.nome)


def criar_pasta_ao_criar_profissional(sender, instance, created, **kwargs):
    if created:
        criar_pasta_foto_profissional(instance.id,instance.nome)



@receiver(pre_save, sender=Paciente)
def deletar_imagem_antiga(sender, instance, **kwargs):
    print('Signal pre_save acionado')  

    if not instance.pk:   
        return

    try:
        paciente_antigo = Paciente.objects.get(pk=instance.pk)
    except Paciente.DoesNotExist:
        return

    imagem_antiga = paciente_antigo.foto
    imagem_nova = instance.foto

    if imagem_antiga and imagem_antiga != imagem_nova:
        caminho = imagem_antiga.path
        if os.path.isfile(caminho):
            print(f'Deletando imagem antiga: {caminho}')  # DEBUG
            os.remove(caminho)


@receiver(pre_save, sender=Profissional)
def deletar_imagem_antiga_profissional(sender, instance, **kwargs):
    print('Signal pre_save Profissional acionado')

    if not instance.pk:
        return

    try:
        profissional_antigo = Profissional.objects.get(pk=instance.pk)
    except Profissional.DoesNotExist:
        return

    imagem_antiga = profissional_antigo.foto
    imagem_nova = instance.foto

    if imagem_antiga and imagem_antiga != imagem_nova:
        caminho = imagem_antiga.path
        if os.path.isfile(caminho):
            print(f'Deletando imagem antiga do Profissional: {caminho}')
            os.remove(caminho)


@receiver(post_save, sender=Pagamento)
def atualizar_receita_apos_pagamento(sender, instance, created, **kwargs):
    print('\n[SIGNAL] post_save Pagamento disparado')
    print('[SIGNAL] Pagamento ID:', instance.id)
    print('[SIGNAL] Pagamento status:', instance.status)
    print('[SIGNAL] Created:', created)

    if instance.status != 'pago':
        print('[SIGNAL] Status != pago → abortando')
        return

    receita = instance.receita
    print('[SIGNAL] Receita ID:', receita.id)
    print('[SIGNAL] Receita status ANTES:', receita.status)

    receita.atualizar_status_por_pagamentos()

    receita.refresh_from_db()
    print('[SIGNAL] Receita status DEPOIS:', receita.status)