from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.utils.timesince import timesince
from django.utils import timezone
from core.models import Notificacao

@login_required
def listar_notificacoes(request):
    notificacoes = Notificacao.objects.filter(
        usuario=request.user
    ).order_by('-criado_em')[:20]

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
