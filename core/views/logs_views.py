from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
from core.models import LogAcao


@login_required
def logs_view(request):
    if not request.user.is_superuser and request.user.tipo != 'admin':
        return HttpResponseForbidden("Acesso negado.")

    logs = LogAcao.objects.all().order_by('-data_hora')[:200]
    return render(request, 'core/auditoria_logs.html', {'logs': logs})