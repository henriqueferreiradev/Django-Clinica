from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST

from django.utils.timesince import timesince
from django.utils import timezone
from core.models import Notificacao

@login_required
def listar_notificacoes(request):
 
    notificacoes = Notificacao.objects.filter(usuario=request.user, lida=False)  # Filtro primeiro
   

    data = []
    for n in notificacoes:
        data.append({
            'id': n.id,
            'titulo': n.titulo,
            'mensagem': n.mensagem,
            'tipo': n.tipo,
            'lida': n.lida,
            'url': n.url,
            'tempo': timesince(n.criado_em, timezone.now()) + ' atrás'
        })

    return JsonResponse({
        'total_nao_lidas': notificacoes.filter(lida=False).count(),
        'notificacoes': data
    })

 

@require_POST
@login_required
def marcar_notificacao_lida(request, id):
    Notificacao.objects.filter(
        id=id,
        usuario=request.user
    ).update(lida=True)

    return JsonResponse({'ok': True})
