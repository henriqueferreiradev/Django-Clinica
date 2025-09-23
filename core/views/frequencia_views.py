# core/views/frequencias.py
import json
from datetime import date
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count
from django.utils import timezone
from core.models import Agendamento, Paciente, FrequenciaMensal

STATUS_CONTA = ['finalizado', 'falta_cobrada']  # status que contam presença


def sync_frequencias_mes(mes, ano):
    """
    Consolida freq_sistema a partir de Agendamento
    """
    contagens = (Agendamento.objects
        .filter(data__year=ano, data__month=mes, status__in=STATUS_CONTA)
        .values('paciente_id')
        .annotate(total=Count('id')))

    for row in contagens:
        pid, total = row['paciente_id'], row['total']
        fm, _ = FrequenciaMensal.objects.get_or_create(
            paciente_id=pid, mes=mes, ano=ano,
            defaults={'freq_sistema': total}
        )
        if fm.freq_sistema != total:
            fm.freq_sistema = total
            fm.save()

    return [row['paciente_id'] for row in contagens]


@require_GET
def frequencias_get(request):
    """
    GET /frequencias?mes=9&ano=2025
    """
    try:
        mes = int(request.GET.get("mes") or date.today().month)
        ano = int(request.GET.get("ano") or date.today().year)
    except ValueError:
        return JsonResponse({"detail": "Parâmetros inválidos"}, status=400)

    # sincroniza freq_sistema
    pacientes_ids = sync_frequencias_mes(mes, ano)

    fms = (FrequenciaMensal.objects
           .filter(paciente_id__in=pacientes_ids, mes=mes, ano=ano)
           .select_related("paciente"))

    items = []
    for fm in fms:
        p = fm.paciente
        items.append({
            "paciente_id": p.id,
            
            "nome": p.nome, 
            "sobrenome": p.sobrenome,
            "cpf": p.cpf,
            "data_cadastro": p.data_cadastro,
            "freq_sistema": fm.freq_sistema,
            "freq_programada": fm.freq_programada,
            "percentual": float(fm.percentual),
            "status": fm.status,
        })

    return JsonResponse({"mes": mes, "ano": ano, "items": items}, safe=False)


@csrf_exempt  # se não tiver CSRF token (ex.: AJAX puro)
@require_POST
def frequencias_post(request):
    """
    POST /frequencias
    body:
    {
      "mes": 9,
      "ano": 2025,
      "items": [
        {"paciente_id": 42, "freq_programada": 12, "observacao": "ajuste"}
      ]
    }
    """
    try:
        body = json.loads(request.body)
        mes, ano = int(body["mes"]), int(body["ano"])
        items = body.get("items", [])
    except Exception as e:
        return JsonResponse({"detail": f"Erro no body: {e}"}, status=400)

    atualizados = []
    for item in items:
        pid = item.get("paciente_id")
        prog = item.get("freq_programada")
        obs = item.get("observacao", "")
        if not pid or prog is None:
            continue

        fm, _ = FrequenciaMensal.objects.get_or_create(
            paciente_id=pid, mes=mes, ano=ano
        )
        fm.freq_programada = int(prog)
        fm.freq_programada_origem = "manual"
        fm.programada_set_por = request.user if request.user.is_authenticated else None
        fm.programada_set_em = timezone.now()
        if obs:
            fm.observacao = obs
        fm.save()  # recalcula percentual/status
        atualizados.append(fm.id)

    fms = (FrequenciaMensal.objects
           .filter(id__in=atualizados)
           .select_related("paciente"))

    items_resp = []
    for fm in fms:
        p = fm.paciente
        items_resp.append({
            "paciente_id": p.id,
            "nome": p.nome,
            "cpf": p.cpf,
            "data_cadastro": p.data_cadastro,
            "freq_sistema": fm.freq_sistema,
            "freq_programada": fm.freq_programada,
            "percentual": float(fm.percentual),
            "status": fm.status,
        })

    return JsonResponse({"mes": mes, "ano": ano, "items": items_resp}, safe=False)
