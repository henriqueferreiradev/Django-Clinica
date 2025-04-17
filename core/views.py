from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout
from django.http import JsonResponse
from .forms import LoginForm, RegisterForm
from django.contrib import messages
from django.contrib.auth.forms import AuthenticationForm
from .models import Paciente, Especialidade, ESTADO_CIVIL, MIDIA_ESCOLHA, COR_RACA, UF_ESCOLHA,SEXO_ESCOLHA
from django.db.models import Q
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from datetime import datetime

def login_view(request):
    login_form = AuthenticationForm(request, data=request.POST or None)
    register_form = RegisterForm(request.POST or None)

    if request.method == 'POST':
        if 'register' in request.POST:
            if register_form.is_valid():
                register_form.save()
                messages.success(request, "Usuário registrado com sucesso!")
                return redirect('login')
        else:
            if login_form.is_valid():
                login(request, login_form.get_user())
                return redirect('dashboard')

    return render(request, 'core/login.html', {
        'form': login_form,
        'register_form': register_form
    })

def logout_view(request):
    logout(request)
    return redirect('login')


@login_required(login_url='login')
def dashboard_view(request):
    return render(request, 'core/dashboard.html')


@login_required(login_url='login')
def pacientes_view(request):
    mostrar_todos = request.GET.get('mostrar_todos') == 'on'
    filtra_inativo = request.GET.get('filtra_inativo') == 'on'
    
    if request.method == 'POST':
        if 'delete_id' in request.POST:
            delete_id = request.POST.get('delete_id')
            paciente = Paciente.objects.get(id=delete_id)
            paciente.ativo = False
            paciente.save()
            return redirect('pacientes')

        # Edição ou criação
        paciente_id = request.POST.get('paciente_id')
        nome = request.POST.get('nome')
        cpf = request.POST.get('cpf')
        telefone = request.POST.get('telefone')
        rg = request.POST.get('rg')
        nascimento = request.POST.get('nascimento')
        cor_raca = request.POST.get('cor')
        sexo = request.POST.get('sexo')
        naturalidade = request.POST.get('naturalidade')
        uf = request.POST.get('uf')
        nomeSocial = request.POST.get('nomeSocial')
        estado_civil = request.POST.get('estado_civil')
        midia = request.POST.get('midia')
        cep = request.POST.get('cep')
        rua = request.POST.get('rua')
        numero = request.POST.get('numero')
        bairro = request.POST.get('bairro')
        cidade = request.POST.get('cidade')
        estado = request.POST.get('estado')
        celular = request.POST.get('celular')
        telEmergencia = request.POST.get('telEmergencia')
        email = request.POST.get('email')
        observacao = request.POST.get('observacao')
        
        if paciente_id:
            paciente = Paciente.objects.get(id=paciente_id)
            paciente.nome = nome
            paciente.cpf = cpf
            paciente.telefone = telefone
            paciente.rg = rg
            paciente.nascimento = nascimento
            paciente.cor_raca = cor_raca
            paciente.sexo = sexo
            paciente.naturalidade = naturalidade
            paciente.uf = uf
            paciente.nomeSocial = nomeSocial
            paciente.estado_civil = estado_civil
            paciente.midia = midia
            paciente.cep = cep
            paciente.rua = rua
            paciente.numero = numero
            paciente.bairro = bairro
            paciente.cidade = cidade
            paciente.estado = estado
            paciente.celular = celular
            paciente.telEmergencia = telEmergencia
            paciente.email = email
            paciente.observacao = observacao
             
            paciente.ativo = True
            paciente.save()
        else:
            # Garante que nome foi enviado
            if nome:
                Paciente.objects.create(nome=nome, cpf=cpf, telefone=telefone,
                                        rg=rg,data_nascimento=nascimento,
                                        cor_raca=cor_raca, sexo=sexo, naturalidade=naturalidade,
                                        uf=uf,nomeSocial=nomeSocial,estado_civil=estado_civil,
                                        midia=midia, cep=cep, rua=rua, numero=numero,bairro=bairro,
                                        cidade=cidade,estado=estado,celular=celular, telEmergencia=telEmergencia,
                                        email=email, observacao=observacao ,ativo=True)

        return redirect('pacientes')

    # Se for GET, continua aqui:
    query = request.GET.get('q', '').strip()

    if mostrar_todos:
        pacientes = Paciente.objects.all().order_by('-id')
    elif filtra_inativo:
        pacientes = Paciente.objects.filter(ativo=False)
    else:
        pacientes = Paciente.objects.filter(ativo=True).order_by('-id')

    total_ativos = Paciente.objects.filter(ativo=True).count()
    

    if query:
        pacientes = pacientes.filter(Q(nome__icontains=query) | Q(cpf__icontains=query))

    paginator = Paginator(pacientes, 12)
    page_number = request.GET.get("page")
    try:
        page_obj = paginator.get_page(page_number)
    except PageNotAnInteger:
        page_obj = paginator.page(1)
    except EmptyPage:
        page_obj = paginator.page(paginator.num_pages)

    return render(request, 'core/pacientes.html', {
        'page_obj': page_obj,
        'query': query,
        'total_ativos': total_ativos,
        'mostrar_todos': mostrar_todos,
        'filtra_inativo': filtra_inativo,
        'estado_civil_choices': ESTADO_CIVIL,
        'midia_choices': MIDIA_ESCOLHA,
        'sexo_choices': SEXO_ESCOLHA,
        'uf_choices': UF_ESCOLHA,
        'cor_choices': COR_RACA,
    })

@csrf_exempt
def reativar_paciente(request, id):
    if request.method == 'POST':
        paciente = get_object_or_404(Paciente, id=id)
        paciente.ativo = True
        paciente.save()
        return JsonResponse({'status': 'ok'})
    return JsonResponse({'status': 'erro'}, status=400)


@csrf_exempt
def reativar_especialidade(request, id):
    if request.method == 'POST':
        especialidade = get_object_or_404(Especialidade, id=id)
        especialidade.ativo = True
        especialidade.save()
        return JsonResponse({'status': 'ok'})
    return JsonResponse({'status': 'erro'}, status=400)



@login_required(login_url='login')
def profissionais_view(request):
    mostrar_todos = request.GET.get('mostrar_todos') == 'on'
    filtra_inativo = request.GET.get('filtra_inativo') == 'on'

    if request.method == 'POST':
            if 'delete_id' in request.POST:
                delete_id = request.POST.get('delete_id')
                especialidades = Especialidade.objects.get(id=delete_id)
                especialidades.ativo = False
                especialidades.save()
                return redirect('profissionais')

            # Edição ou criação
            especialidade_id = request.POST.get('especialidade_id')
            nome_especialidade = request.POST.get('especialidade')
 

            if especialidade_id:
                especialidades = Especialidade.objects.get(id=especialidade_id)
                especialidades.nome = nome_especialidade
                especialidades.ativo = True
                especialidades.save()
            else:
                # Garante que nome foi enviado
                if nome_especialidade:
                    Especialidade.objects.create(nome=nome_especialidade, ativo=True)

    query = request.GET.get('q', '').strip()

    if mostrar_todos:
        especialidades = Especialidade.objects.all().order_by('-id')
    elif filtra_inativo:
        especialidades = Especialidade.objects.filter(ativo=False)
    else:
        especialidades = Especialidade.objects.filter(ativo=True).order_by('-id')

    total_ativos = Especialidade.objects.filter(ativo=True).count()
    

    if query:
        especialidades = especialidades.filter(Q(nome__icontains=query))

    paginator = Paginator(especialidades, 12)
    page_number = request.GET.get("page")
    try:
        page_obj = paginator.get_page(page_number)
    except PageNotAnInteger:
        page_obj = paginator.page(1)
    except EmptyPage:
        page_obj = paginator.page(paginator.num_pages)

    return render(request, 'core/profissionais.html', {
        'page_obj': page_obj,
        'query': query,
        'total_ativos': total_ativos,
        'mostrar_todos': mostrar_todos,
        'filtra_inativo': filtra_inativo,
    })


@login_required(login_url='login')
def financeiro_view(request):
    return render(request, 'core/financeiro.html')


@login_required(login_url='login')
def agendamento_view(request):
    return render(request, 'core/agendamentos.html')


@login_required(login_url='login')
def configuracao_view(request):
    return render(request, 'core/configuracoes.html')

