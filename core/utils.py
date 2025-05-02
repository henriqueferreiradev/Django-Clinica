import os
from django.utils.text import slugify
from django.conf import settings

def criar_pasta_foto_paciente(id_paciente, nome_paciente):
    nome = slugify(nome_paciente)
    caminho = os.path.join(settings.MEDIA_ROOT, f'imagens/pacientes/{id_paciente}_{nome}')
    os.makedirs(caminho, exist_ok=True)