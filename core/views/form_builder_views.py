from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from core.utils import registrar_log
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponseNotAllowed, HttpResponse
from django.views.decorators.http import require_http_methods
import json
from core.models import Formulario, Pergunta, OpcaoResposta, LinkFormularioPaciente, RespostaFormulario, RespostaPergunta, Paciente
from django.contrib import messages


def form_builder(request):
 
    
    formularios = Formulario.objects.filter(ativo=True).order_by('-criado_em')
     
    return render(request, 'core/formularios/formularios_ativos.html',{'formularios': formularios})

 
def novo_formulario(request):
    print("Entrou na view novo_formulario")  # Debug
    if request.method == 'POST':
  
        titulo = request.POST.get('title', '').strip()
        descricao = request.POST.get('description', '').strip()
        
        if not titulo or not descricao:
            messages.error(request, 'Os campos "Título" e "Descrição" devem ser preenchidos.')
            return render(request, 'core/formularios/criar_formulario.html', status=400)
        
        try:

            formulario = Formulario.objects.create(
                titulo=titulo,
                descricao=descricao
            )

            question_count = int(request.POST.get('question_count', 0))
            for i in range(question_count):
                texto = request.POST.get(f'questions[{i}][text]')
                tipo = request.POST.get(f'questions[{i}][type]')
                obrigatoria = request.POST.get(f'questions[{i}][required]') == 'on'
                
                pergunta = Pergunta.objects.create(
                    formulario=formulario,
                    texto=texto,
                    tipo=tipo,
                    obrigatoria=obrigatoria
                )
                
                # Processar opções para perguntas de múltipla escolha
                if tipo in ['multiple-choice', 'checkbox', 'dropdown']:
                    option_count = int(request.POST.get(f'questions[{i}][option_count]', 0))
                    for j in range(option_count):
                        opcao = request.POST.get(f'questions[{i}][options][{j}]')
                        if opcao:
                            OpcaoResposta.objects.create(
                                pergunta=pergunta,
                                texto=opcao
                            )
            messages.success(request, 'Formulário criado com sucesso!')
            registrar_log(
                    usuario=request.user,
                    acao='Criação',
                    modelo='Formulário',
                    objeto_id=formulario.id,
                    descricao=f'Formulário {formulario.titulo} criado.'
                )
            return render(request, 'core/formularios/criar_formulario.html')
    
        except Exception as e:
            messages.error(request, f'Ocorreu um erro: {str(e)}')
            return render(request, 'core/formularios/criar_formulario.html', {
               
            })
    
  
    return render(request, 'core/formularios/criar_formulario.html')



def editar_formulario(request, form_id):
    formulario = get_object_or_404(Formulario, id=form_id)
    
    if request.method == 'GET':
        # Carrega o formulário com todas as perguntas e opções relacionadas
        perguntas = formulario.perguntas.all().prefetch_related('opcoes')
        
        return render(request, 'core/formularios/editar_formulario.html', {
            'formulario': formulario,
            'perguntas': perguntas
        })
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            # Atualiza dados básicos do formulário
            formulario.titulo = data.get('title', formulario.titulo)
            formulario.descricao = data.get('description', formulario.descricao)
            formulario.save()
            
            # Remove perguntas antigas
            formulario.perguntas.all().delete()
            
            # Cria novas perguntas
            for q in data['questions']:
                pergunta = Pergunta.objects.create(
                    formulario=formulario,
                    texto=q['text'],
                    tipo=q['type'],
                    obrigatoria=q['required']
                )

                # Adiciona opções se for tipo com opções
                if pergunta.tipo in ['multiple-choice', 'checkbox', 'dropdown']:
                    for opcao in q['options']:
                        OpcaoResposta.objects.create(
                            pergunta=pergunta,
                            texto=opcao
                        )
            registrar_log(
                    usuario=request.user,
                    acao='Edição',
                    modelo='Formulário',
                    objeto_id=formulario.id,
                    descricao=f'Formulário {formulario.titulo} editado.'
                )
            return JsonResponse({'status': 'ok', 'id': formulario.id})
        
        except Exception as e:
            print(f"Erro ao editar formulário: {str(e)}")
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    
    return JsonResponse({'error': 'Método não permitido'}, status=405)
 
def inativar_formulario(request, form_id):
    formulario = get_object_or_404(Formulario, id=form_id)
    formulario.ativo = False
    formulario.save()
    messages.success(request, 'Formulário inativado com sucesso!')
    registrar_log(
        usuario=request.user,
        acao='Criação',
        modelo='Formulário',
        objeto_id=formulario.id,
        descricao=f'Formulário {formulario.titulo} criado.'
    )
    return redirect('formularios')   
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

    return render(request, 'core/formularios/visualizar_formulario.html', {
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
        return render(request, 'core/formularios/agradecimento.html', {'formulario': formulario})

    return render(request, 'core/formularios/responder_formulario.html', {
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
    formularios = Formulario.objects.filter(ativo=True)
    links_personalizados = []

    for form in formularios:
        link, _ = LinkFormularioPaciente.objects.get_or_create(formulario=form, paciente=paciente)
        links_personalizados.append(link)

    return render(request, 'core/formularios/formularios_para_paciente.html', {
        'paciente': paciente,
        'links': links_personalizados
    })