from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Paciente
from .utils import criar_pasta_foto_paciente, criar_pasta_foto_profissional
import os

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






