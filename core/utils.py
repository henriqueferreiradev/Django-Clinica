import os
from django.utils.text import slugify
from django.conf import settings

def criar_pasta_foto_paciente(id_paciente, nome_paciente):
    nome = slugify(nome_paciente)
    caminho = os.path.join(settings.MEDIA_ROOT, f'imagens/pacientes/{id_paciente}_{nome}')
    os.makedirs(caminho, exist_ok=True)


def criar_pasta_foto_profissional(id_profissional, nome_profissional):
    nome = slugify(nome_profissional)
    caminho = os.path.join(settings.MEDIA_ROOT, f'imagens/profissionais/{id_profissional}_{nome}')
    os.makedirs(caminho, exist_ok=True)


def filtrar_ativos_inativos(request, modelo, prefixo=''):
    mostrar_todos = request.GET.get(f'mostrar_todos_{prefixo}') == 'on'
    filtra_inativo = request.GET.get(f'filtra_inativo_{prefixo}') == 'on'
    
    if mostrar_todos:
        queryset = modelo.objects.all().order_by('-id')
    elif filtra_inativo:
        queryset = modelo.objects.filter(ativo=False)
    else:
        queryset = modelo.objects.filter(ativo=True).order_by('-id')

    total_ativos = modelo.objects.filter(ativo=True).count()

    return queryset, total_ativos, mostrar_todos, filtra_inativo

def alterar_status_ativo(request, modelo, ativar=True, prefixo=''):
    obj_id = request.POST.get(f'{prefixo}_id')
    if obj_id:
        try:
            obj = modelo.objects.get(id=obj_id)
            obj.ativo = ativar
            obj.save()
        except modelo.DoesNotExist:
            print(f"{modelo.__name__} com ID {obj_id} não encontrado para alteração de status.")
    else:
        print(f"ID não enviado para alteração de status em {modelo.__name__}.")