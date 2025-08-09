from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
 
from core.utils import alterar_status_agendamento, registrar_log
 
# views.py
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponseNotAllowed, Http404
from django.views.decorators.http import require_POST
import json
from core.models import Formulario, Pergunta, OpcaoResposta, LinkFormularioPaciente,RespostaFormulario,RespostaPergunta,Paciente
from django.contrib import messages


def form_builder(request):
    if request.method == 'POST':
        delete_id = request.POST.get('delete_id')
        
        if delete_id:  # Verifica se não está vazio
            try:
                formulario = Formulario.objects.get(id=int(delete_id)) 
                formulario.ativo = False
                formulario.save()
                messages.warning(request, f'Formulário {formulario.titulo} inativado') 
                registrar_log(
                    usuario=request.user,
                    acao='Inativação',
                    modelo='Formulário',
                    objeto_id=formulario.id,
                    descricao=f'Formulário {formulario.titulo} inativado.'
                )
                return redirect('criar_formulario')
            except (ValueError, Formulario.DoesNotExist):
                messages.error(request, 'ID do formulário inválido')
                return redirect('criar_formulario')
        else:
            messages.error(request, 'Nenhum ID de formulário fornecido')
            return redirect('criar_formulario')

    return render(request, 'core/form_builder/form_builder.html')

@csrf_exempt
def salvar_formulario(request):
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
    
    try:
        print("📥 Dados recebidos:", request.body)
        data = json.loads(request.body)

        # Verifica se é para editar (não deveria chegar aqui se for edição)
        if 'id' in data and data['id']:
            return JsonResponse({
                'status': 'erro', 
                'msg': 'Use a rota de edição para formulários existentes'
            }, status=400)

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
        
        print("✅ Novo formulário salvo com sucesso:", formulario.id)
        return JsonResponse({'status': 'ok', 'id': formulario.id})
    
    except Exception as e:
        print("❌ Erro ao salvar:", str(e))
        return JsonResponse({'status': 'erro', 'msg': str(e)}, status=400)
    
def editar_formulario(request, form_id):
    if request.method != 'PUT':
        return JsonResponse({'error': 'Método não permitido'}, status=405)
    try:
        print(f"📥 Editando formulário ID: {form_id}")
        data = json.loads(request.body)
        
        # Obtém o formulário existente
        formulario = Formulario.objects.get(id=form_id)
        if not data.get('title') or not data.get('questions'):
            messages.error(request, 'Formulário não pode estar vazio!')
            return JsonResponse({'status': 'error'}, status=400)
        # Atualiza os dados básicos
        formulario.titulo = data.get('title', formulario.titulo)
        formulario.descricao = data.get('description', formulario.descricao)
        formulario.save()
        
        # Remove perguntas antigas (opcional, depende da sua lógica de negócio)
        formulario.perguntas.all().delete()
        
        # Recria as perguntas com os novos dados
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
        
        messages.success(request, f'Formulário "{formulario.titulo}" atualizado com sucesso!')

        return JsonResponse({'status': 'ok'})
    
    except Formulario.DoesNotExist:
        return JsonResponse({'status': 'erro', 'msg': 'Formulário não encontrado'}, status=404)
    except Exception as e:
        print(f"❌ Erro ao editar: {str(e)}")
        return JsonResponse({'status': 'erro', 'msg': str(e)}, status=400)
    
def listar_formularios(request):
    formularios = Formulario.objects.filter(ativo=True).order_by('-criado_em')
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
 

def obter_formulario(request, form_id):
    try:
        formulario = Formulario.objects.get(id=form_id)
        perguntas = Pergunta.objects.filter(formulario=formulario).values('texto', 'tipo', 'obrigatoria', 'opcoes')
        
        data = {
            'titulo': formulario.titulo,
            'descricao': formulario.descricao,
            'perguntas': list(perguntas)
        }
        
        return JsonResponse(data)
    
    except Formulario.DoesNotExist:
        return JsonResponse({'error': 'Formulário não encontrado'}, status=404)
    
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