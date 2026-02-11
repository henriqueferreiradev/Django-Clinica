# core/views/frequencias.py
import json
from datetime import date
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_protect
from django.db import transaction
from django.db.models import Count
from django.utils import timezone
from core.models import Agendamento, Paciente, FrequenciaMensal
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
STATUS_CONTA = ['finalizado']  # status que contam presença


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

@login_required
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
    sync_frequencias_mes(mes, ano)
    mes_fechado = FrequenciaMensal.objects.filter(mes=mes, ano=ano, fechado=True).exists()
    fms = (FrequenciaMensal.objects
           .filter(mes=mes, ano=ano)
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
            'fechado': fm.fechado,
        })

    return JsonResponse({"mes": mes, "ano": ano, "items": items, 'mes_fechado': mes_fechado}, safe=False)


def _as_int(v, default=0):
    try:
        return int(v)
    except (TypeError, ValueError):
        return default

def _parse_mes_ano(mes, ano):
    mes = _as_int(mes, date.today().month)
    ano = _as_int(ano, date.today().year)
    if not (1 <= mes <= 12):
        raise ValueError("mes inválido (1..12)")
    if not (2000 <= ano <= 2100):
        raise ValueError("ano inválido (2000..2100)")
    return mes, ano


@require_POST
@csrf_protect
def frequencias_post(request):
    """
    POST /frequencias

    Aceita:
    - JSON (Content-Type: application/json):
      {
        "mes": 9,
        "ano": 2025,
        "items": [
          {"paciente_id": 42, "freq_programada": 12, "observacao": "ajuste"}
        ]
      }

    - FORM (Content-Type: application/x-www-form-urlencoded):
      mes=9&ano=2025&paciente_id[]=42&freq_programada[]=12&observacao[]=ajuste
    """
    # ------- Entrada (JSON OU FORM) -------
    content_type = (request.headers.get("Content-Type") or "").lower()

    try:
        if content_type.startswith("application/json"):
            try:
                body = json.loads(request.body or b"{}")
            except json.JSONDecodeError as e:
                return JsonResponse({"detail": f"JSON inválido: {e}"}, status=400)

            print("AÇÃO RECEBIDA:", acao)

            mes, ano = _parse_mes_ano(body.get("mes"), body.get("ano"))

            acao = (body.get("acao") or "parcial").strip().lower()

            if FrequenciaMensal.objects.filter(mes=mes, ano=ano, fechado=True).exists():
                return JsonResponse({"detail": "Mês já fechado. Edição não permitida."}, status=409)

            raw_items = body.get("items", [])
            if not isinstance(raw_items, list):
                return JsonResponse({"detail": "`items` deve ser lista"}, status=400)

            items = []
            for it in raw_items:
                if not isinstance(it, dict):
                    continue
                pid = _as_int(it.get("paciente_id"), None)
                prog = _as_int(it.get("freq_programada"), None)
                obs = (it.get("observacao") or "").strip()
                if pid is None or prog is None:
                    continue
                items.append({"paciente_id": pid, "freq_programada": prog, "observacao": obs})

        else:
            # FORM (sem JS)
            mes, ano = _parse_mes_ano(request.POST.get("mes"), request.POST.get("ano"))
            acao = (request.POST.get("acao") or "parcial").strip().lower()

            if FrequenciaMensal.objects.filter(mes=mes, ano=ano, fechado=True).exists():
                return JsonResponse({"detail": "Mês já fechado. Edição não permitida."}, status=409)

            ids   = request.POST.getlist("paciente_id[]") or request.POST.getlist("paciente_id")
            progs = request.POST.getlist("freq_programada[]") or request.POST.getlist("freq_programada")
            obss  = request.POST.getlist("observacao[]") or request.POST.getlist("observacao")

            if not ids and not progs:
                return JsonResponse({"detail": "Nada para processar"}, status=400)
            if len(ids) != len(progs):
                return JsonResponse({"detail": "Listas com tamanhos diferentes (paciente_id[] vs freq_programada[])"}, status=400)

            items = []
            for i, pid in enumerate(ids):
                pid_int = _as_int(pid, None)
                if pid_int is None:
                    continue
                prog_int = _as_int(progs[i], 0)
                obs = (obss[i] if i < len(obss) else "") or ""
                items.append({"paciente_id": pid_int, "freq_programada": prog_int, "observacao": obs.strip()})

    except ValueError as e:
        return JsonResponse({"detail": str(e)}, status=400)

    if not items:
        return JsonResponse({"detail": "Nenhum item válido"}, status=400)

    # ------- Persistência -------
    atualizados_ids = []
    now = timezone.now()
    user = request.user if getattr(request, "user", None) and request.user.is_authenticated else None

    # Salva em transação para consistência
    with transaction.atomic():
        for item in items:
            pid = item["paciente_id"]
            prog = item["freq_programada"]
            obs = item.get("observacao") or ""

            fm, _ = FrequenciaMensal.objects.get_or_create(
                paciente_id=pid, mes=mes, ano=ano
            )

            # Campos manuais
            fm.freq_programada = prog
            fm.freq_programada_origem = "manual"
            fm.programada_set_por = user
            fm.programada_set_em = now
            if obs:
                fm.observacao = obs

            # save() deve recalcular percentual/status (conforme sua model)
            fm.save()
            atualizados_ids.append(fm.id)
            
        if acao == "finalizar":
            FrequenciaMensal.objects.filter(mes=mes, ano=ano).update(fechado=True)
    # ------- Resposta (retorna os itens atualizados com paciente) -------
    fms = (FrequenciaMensal.objects
           .filter(id__in=atualizados_ids)
           .select_related("paciente"))

    items_resp = []
    for fm in fms:
        p = fm.paciente
        items_resp.append({
            "paciente_id": p.id,
            "nome": getattr(p, "nome", ""),
            "sobrenome": getattr(p, "sobrenome", ""),
            "cpf": getattr(p, "cpf", ""),
            "data_cadastro": getattr(p, "data_cadastro", None),
            "freq_sistema": fm.freq_sistema,
            "freq_programada": fm.freq_programada,
            "percentual": float(fm.percentual or 0),
            "status": fm.status,
        })
    from django.shortcuts import redirect
    from django.urls import reverse

    return redirect(reverse("status_pacientes") + f"?mes={mes}&ano={ano}")

 