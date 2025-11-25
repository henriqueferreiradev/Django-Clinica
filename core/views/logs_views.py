from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
from core.models import LogAcao
from django.db.models import F
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage

@login_required
@login_required
def logs_view(request):
    if not request.user.is_superuser and request.user.tipo != 'admin':
        return HttpResponseForbidden("Acesso negado.")

    # Comece com a queryset sem slice
    logs = LogAcao.objects.all().order_by('-data_hora')

    # Filtros
    acao = request.GET.get('acao')
    modelo = request.GET.get('modelo')
    data_inicio = request.GET.get('data_inicio')
    data_fim = request.GET.get('data_fim')

    if acao:
        logs = logs.filter(acao=acao)
    if modelo:
        logs = logs.filter(modelo=modelo)
    if data_inicio:
        logs = logs.filter(data_hora__date__gte=data_inicio)
    if data_fim:
        logs = logs.filter(data_hora__date__lte=data_fim)

 
    # Valores únicos para os selects
    acoes_disponiveis = LogAcao.objects.values_list('acao', flat=True).distinct()
    modelos_disponiveis = LogAcao.objects.values_list('modelo', flat=True).distinct()

    # Ordenação final
    

 

    # PAGINAÇÃO - EXATAMENTE COMO NO CONTAS A RECEBER
    paginator = Paginator(logs,13)  # 10 pacientes por página
    page_number = request.GET.get('page')
    
    try:
        page_obj = paginator.get_page(page_number)
    except PageNotAnInteger :
        page_obj = paginator.get_page(1)
    except EmptyPage:
        page_obj = paginator.get_page(paginator.num_pages)


    context = {
        'logs': logs,
        'page_obj':page_obj,
        'filtros': {
            'acao': acao or '',
            'modelo': modelo or '',
            'data_inicio': data_inicio or '',
            'data_fim': data_fim or '',
        },
        'acoes_disponiveis': acoes_disponiveis,
        'modelos_disponiveis': modelos_disponiveis,
    }
    return render(request, 'core/auditoria_logs.html', context)
