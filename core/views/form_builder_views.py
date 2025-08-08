from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from core.models import Paciente, Especialidade,Profissional, Servico,PacotePaciente,Agendamento,Resposta,Pagamento, ESTADO_CIVIL, MIDIA_ESCOLHA, VINCULO, COR_RACA, UF_ESCOLHA,SEXO_ESCOLHA, CONSELHO_ESCOLHA
from datetime import date, datetime, timedelta
from django.utils import timezone
from core.utils import alterar_status_agendamento, registrar_log
import json
import locale
from django.db.models.functions import TruncMonth
from django.db.models import Count
import random
# views.py
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponseNotAllowed, Http404
from django.views.decorators.http import require_POST
import json
from core.models import Formulario, Pergunta, OpcaoResposta, LinkFormularioPaciente,RespostaFormulario,RespostaPergunta
from django.contrib import messages


def form_builder(request):
    if request.method == 'POST':
        if 'delete_id' in request.POST:
            formulario = Formulario.objects.get(id=request.POST['delete_id'])
            formulario.ativo = False
            formulario.save()
            messages.warning(request, f'Formulário {formulario.nome} inativado') 
            registrar_log(usuario=request.user,
                acao='Inativação',
                modelo='Formulário',
                objeto_id=formulario.id,
                descricao=f'Paciente {formulario.nome} inativado.')
            return redirect('criar_formulario')

    return render(request, 'core/form_builder/form_builder.html')




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
    
def responder_formulario_token(request, slug, token):
    link = get_object_or_404(LinkFormularioPaciente, formulario__slug=slug, token=token)
    formulario = link.formulario
    paciente = link.paciente
    perguntas = formulario.perguntas.prefetch_related('opcoes')

    if request.method == 'POST':
        resposta = RespostaFormulario.objects.create(paciente=paciente, formulario=formulario)
        for pergunta in perguntas:
            key = f'pergunta_{pergunta.id}'

            if pergunta.tipo == 'checkbox':
                valores = request.POST.getlist(key)
                valor = ', '.join(valores)
            else:
                valor = request.POST.get(key)

            if valor:
                RespostaPergunta.objects.create(
                    resposta=resposta,
                    pergunta=pergunta,
                    valor=valor
                )
        print(f'Nova Resposta recebida de {paciente.nome}')
        return render(request, 'core/form_builder/agradecimento.html', {'formulario': formulario})

    return render(request, 'core/form_builder/responder_formulario.html', {
        'formulario': formulario,
        'perguntas': perguntas
    })

def formularios_para_paciente(request, paciente_id):
    paciente = get_object_or_404(Paciente, id=paciente_id)
    formularios = Formulario.objects.all()
    links_personalizados = []

    for form in formularios:
        link, _ = LinkFormularioPaciente.objects.get_or_create(formulario=form, paciente=paciente)
        links_personalizados.append(link)

    return render(request, 'core/form_builder/formularios_para_paciente.html', {
        'paciente': paciente,
        'links': links_personalizados
    })