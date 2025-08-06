from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from core.models import Paciente, Especialidade,Profissional, Servico,PacotePaciente,Agendamento,Resposta,Pagamento, ESTADO_CIVIL, MIDIA_ESCOLHA, VINCULO, COR_RACA, UF_ESCOLHA,SEXO_ESCOLHA, CONSELHO_ESCOLHA
from datetime import date, datetime, timedelta
from django.utils import timezone
from core.utils import alterar_status_agendamento
import json
import locale
from django.db.models.functions import TruncMonth
from django.db.models import Count
import random


def form_builder(request):
    return render(request, 'core/form_builder/form_builder.html')

# views.py
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.views.decorators.http import require_POST
import json
from core.models import Formulario, Pergunta, OpcaoResposta


def salvar_formulario(request):
    try:
        print("📥 Dados recebidos:", request.body)
        data = json.loads(request.body)

        formulario = Formulario.objects.create(
            titulo=data['title'],
            descricao=data['description']
        )

        for q in data['questions']:
            pergunta = Pergunta.objects.create(
                formulario=formulario,
                texto=q['text'],
                tipo=q['type'],
                obrigatoria=q['required']
            )

            if pergunta.tipo in ['multiple-choice', 'checkbox', 'dropdown']:
                for opcao in q['options']:
                    OpcaoResposta.objects.create(
                        pergunta=pergunta,
                        texto=opcao
                    )

        print("✅ Formulário salvo com sucesso:", formulario)
        return JsonResponse({'status': 'ok'})
    except Exception as e:
        print("❌ Erro ao salvar:", str(e))
        return JsonResponse({'status': 'erro', 'msg': str(e)}, status=400)
def listar_formularios(request):
    formularios = Formulario.objects.all().order_by('-criado_em')
    data = [
        {
            'id': f.id,
            'titulo': f.titulo,
            'descricao': f.descricao,
            'criado_em': f.criado_em.isoformat()
        }
        for f in formularios
    ]
    return JsonResponse(data, safe=False)


def visualizar_formulario(request, id):
    formulario = get_object_or_404(Formulario, id=id)
    perguntas = formulario.perguntas.all().prefetch_related('opcoes')

    return render(request, 'core/form_builder/visualizar_formulario.html', {
        'formulario': formulario,
        'perguntas': perguntas,
    })
    

