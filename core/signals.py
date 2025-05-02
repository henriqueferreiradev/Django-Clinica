from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Paciente
from .utils import criar_pasta_foto_paciente

@receiver(post_save, sender=Paciente)
def criar_pasta_ao_criar_paciente(sender, instance, created, **kwargs):
    if created:
        criar_pasta_foto_paciente(instance.id,instance.nome)