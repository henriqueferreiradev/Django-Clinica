from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout
from django.http import JsonResponse
from .forms import LoginForm, RegisterForm
from django.contrib import messages
from django.contrib.auth.forms import AuthenticationForm
from .models import Paciente, Especialidade,Profissional, ESTADO_CIVIL, MIDIA_ESCOLHA, VINCULO, COR_RACA, UF_ESCOLHA,SEXO_ESCOLHA, CONSELHO_ESCOLHA
from django.db.models import Q
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from datetime import date, datetime
from dateutil.relativedelta import relativedelta


def dados_paciente(request, paciente_id):
    paciente = get_object_or_404(Paciente, id=paciente_id)
    
    if paciente.data_nascimento:
        nascimento = paciente.data_nascimento
        hoje = date.today()
        idade = relativedelta(hoje, nascimento)
        idade_formatada = f'{idade.years} anos, {idade.months} meses e {idade.days} dias'

    data = {
        "nome": paciente.nome,
        "sobrenome": paciente.sobrenome,
        "nomeSocial": paciente.nomeSocial,
        "rg": paciente.rg,
        "cpf": paciente.cpf,
        "nascimento": paciente.data_nascimento.strftime('%d/%m/%Y') if paciente.data_nascimento else "",
        "idade":idade_formatada,
        "cor_raca": paciente.get_cor_raca_display(),  
        "sexo": paciente.get_sexo_display(),
        "estado_civil": paciente.get_estado_civil_display(),
        "naturalidade": paciente.naturalidade,
        "uf": paciente.uf,
        "midia": paciente.get_midia_display(),
        "foto": paciente.foto.url if paciente.foto else "",
        "observacao": paciente.observacao,
        "cep": paciente.cep,
        "rua": paciente.rua,
        "numero": paciente.numero,
        "complemento": paciente.complemento,
        "bairro": paciente.bairro,
        "cidade": paciente.cidade,
        "estado": paciente.estado,
        "telefone": paciente.telefone,
        "celular": paciente.celular,
        "email": paciente.email,
        "nomeEmergencia": paciente.nomeEmergencia,
        "vinculo": paciente.get_vinculo_display(),
        "telEmergencia": paciente.telEmergencia,
        "ativo": paciente.ativo
    }
    return JsonResponse(data)

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
    situacao = request.GET.get('situacao') == True
    
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

    return render(request, 'core/pacientes/pacientes.html', {
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

@login_required(login_url='login')
def cadastrar_pacientes_view(request):
    mostrar_todos = request.GET.get('mostrar_todos') == 'on'
    filtra_inativo = request.GET.get('filtra_inativo') == 'on'
    situacao = request.GET.get('situacao') == True
    
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
        sobrenome = request.POST.get('sobrenome')
        nomeSocial = request.POST.get('nomeSocial')
        rg = request.POST.get('rg')
        cpf = request.POST.get('cpf')
        nascimento = request.POST.get('nascimento')
        try:
            nascimento_formatada = datetime.strptime(nascimento, "%d/%m/%Y").date()
        except ValueError:
            ...
        cor_raca = request.POST.get('cor')
        sexo = request.POST.get('sexo')
        estado_civil = request.POST.get('estado_civil')
        naturalidade = request.POST.get('naturalidade')
        uf = request.POST.get('uf')
        midia = request.POST.get('midia')
        foto = request.FILES.get('foto')
        observacao = request.POST.get('observacao')

        cep = request.POST.get('cep')
        rua = request.POST.get('rua')
        numero = request.POST.get('numero')
        complemento = request.POST.get('complemento')
        bairro = request.POST.get('bairro')
        cidade = request.POST.get('cidade')
        estado = request.POST.get('estado')

        telefone = request.POST.get('telefone')
        celular = request.POST.get('celular')
        email = request.POST.get('email')
        nomeEmergencia = request.POST.get('nomeEmergencia')
        vinculo = request.POST.get('vinculo')
        telEmergencia = request.POST.get('telEmergencia')
        
        
        
        if paciente_id:
            paciente = Paciente.objects.get(id=paciente_id)
            paciente.nome = nome
            paciente.sobrenome = sobrenome
            paciente.nomeSocial = nomeSocial
            paciente.rg = rg
            paciente.cpf = cpf
            paciente.nascimento = nascimento
            paciente.cor_raca = cor_raca
            paciente.sexo = sexo
            paciente.estado_civil = estado_civil
            paciente.naturalidade = naturalidade
            paciente.uf = uf
            paciente.midia = midia
            paciente.foto = foto
            paciente.observacao = observacao

            paciente.cep = cep
            paciente.rua = rua
            paciente.numero = numero
            paciente.complemento = complemento
            paciente.bairro = bairro
            paciente.cidade = cidade
            paciente.estado = estado

            paciente.telefone = telefone
            paciente.celular = celular
            paciente.email = email
            paciente.nomeEmergencia = nomeEmergencia
            paciente.vinculo = vinculo
            paciente.telEmergencia = telEmergencia
             
            paciente.ativo = True
            paciente.save()
        else:
            # Garante que nome foi enviado
            if nome:
                paciente = Paciente.objects.create(nome=nome, sobrenome=sobrenome, nomeSocial=nomeSocial, cpf=cpf,
                                        vinculo=vinculo,
                                        rg=rg,data_nascimento=nascimento_formatada,
                                        cor_raca=cor_raca, sexo=sexo, naturalidade=naturalidade,
                                        uf=uf,estado_civil=estado_civil, complemento=complemento,
                                        midia=midia, cep=cep, rua=rua, numero=numero,bairro=bairro,
                                        cidade=cidade,estado=estado,telefone=telefone, celular=celular, 
                                        nomeEmergencia=nomeEmergencia, telEmergencia=telEmergencia,
                                        email=email, observacao=observacao ,ativo=True)
            if foto:
                paciente.foto = foto
                paciente.save()
        
        messages.success(request, f'Paciente { paciente.nome } cadastrado com sucesso!!')
        return redirect('cadastrar_paciente')

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

    return render(request, 'core/pacientes/cadastrar_paciente.html', {
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
        'vinculo_choices': VINCULO,
    })
  
def editar_paciente_view(request,id):

    
    paciente = get_object_or_404(Paciente, id=id)

    if request.method == 'POST':
        paciente.nome = request.POST.get('nome')
        paciente.sobrenome = request.POST.get('sobrenome')
        paciente.nomeSocial = request.POST.get('nomeSocial')
        paciente.rg = request.POST.get('rg')
        paciente.cpf = request.POST.get('cpf')
        
        nascimento = request.POST.get('nascimento')
        try:
            paciente.nascimento = datetime.strptime(nascimento, "%d/%m/%Y").date()
        except (ValueError, TypeError):
            paciente.nascimento = None  

        paciente.cor_rac = request.POST.get('cor')
        paciente.sexo = request.POST.get('sexo')
        paciente.estado_civil = request.POST.get('estado_civil')
        paciente.naturalidade = request.POST.get('naturalidade')
        paciente.uf = request.POST.get('uf')
        paciente.midia = request.POST.get('midia')
        paciente.observacao = request.POST.get('observacao')

        paciente.cep = request.POST.get('cep')
        paciente.rua = request.POST.get('rua')
        paciente.complemento = request.POST.get('complemento')
        paciente.numero = request.POST.get('numero')
        paciente.bairro = request.POST.get('bairro')
        paciente.cidade = request.POST.get('cidade')
        paciente.estado = request.POST.get('estado')

        paciente.telefone = request.POST.get('telefone')
        paciente.celular = request.POST.get('celular')
        paciente.email = request.POST.get('email')
        paciente.nomeEmergencia = request.POST.get('nomeEmergencia')
        paciente.vinculo = request.POST.get('vinculo')
        paciente.telEmergencia = request.POST.get('telEmergencia')

        if 'foto' in request.FILES:
            paciente.foto = request.FILES['foto']

        paciente.save()
        return redirect('pacientes')  

    context = {
        'paciente': paciente,
        'estado_civil_choices': ESTADO_CIVIL,
        'midia_choices': MIDIA_ESCOLHA,
        'sexo_choices': SEXO_ESCOLHA,
        'uf_choices': UF_ESCOLHA,
        'cor_choices': COR_RACA,
        'vinculo_choices': VINCULO,
    }
    return render(request, 'core/pacientes/editar_paciente.html', context)
 

def ficha_paciente(request, id):
    paciente = get_object_or_404(Paciente, id=id)
    return render(request, 'core/pacientes/ficha_paciente.html', {'paciente': paciente})



def cadastrar_profissionais_view(request):
    if request.method == 'POST':
        if 'delete_id' in request.POST:
            delete_id = request.POST.get('delete_id')
            profissional = Profissional.objects.get(id=delete_id)
            profissional.ativo = False
            profissional.save()
            return redirect('profissionals')

        # Criação de novo profissional
        nome = request.POST.get('nome')
        sobrenome = request.POST.get('sobrenome')
        nomeSocial = request.POST.get('nomeSocial')
        rg = request.POST.get('rg')
        cpf = request.POST.get('cpf')
        cnpj = request.POST.get('cnpj')
        nascimento = request.POST.get('nascimento')
        try:
            nascimento_formatada = datetime.strptime(nascimento, "%d/%m/%Y").date()
        except ValueError:
            nascimento_formatada = None  # ou algum tratamento específico
        cor_raca = request.POST.get('cor')
        sexo = request.POST.get('sexo')
        estado_civil = request.POST.get('estado_civil')
        naturalidade = request.POST.get('naturalidade')
        uf = request.POST.get('uf')
        especialidade_id = request.POST.get('especialidade')
        especialidade_obj = Especialidade.objects.get(id=especialidade_id) if especialidade_id else None
        conselho1 = request.POST.get('conselho1')
        conselho2 = request.POST.get('conselho2')
        conselho3 = request.POST.get('conselho3')
        conselho4 = request.POST.get('conselho4')

        num1_conselho = request.POST.get("num1_conselho")
        num2_conselho = request.POST.get("num2_conselho")
        num3_conselho = request.POST.get("num3_conselho")
        num4_conselho = request.POST.get("num4_conselho")

        midia = request.POST.get('midia')
        foto = request.FILES.get('foto')
        observacao = request.POST.get('observacao')

        cep = request.POST.get('cep')
        rua = request.POST.get('rua')
        numero = request.POST.get('numero')
        complemento = request.POST.get('complemento')
        bairro = request.POST.get('bairro')
        cidade = request.POST.get('cidade')
        estado = request.POST.get('estado')

        telefone = request.POST.get('telefone')
        celular = request.POST.get('celular')
        email = request.POST.get('email')
        nomeEmergencia = request.POST.get('nomeEmergencia')
        vinculo = request.POST.get('vinculo')
        telEmergencia = request.POST.get('telEmergencia')

     
        if nome:
    # 1º: Cria o profissional sem a foto
            profissional = Profissional.objects.create(
                nome=nome,
                sobrenome=sobrenome,
                nomeSocial=nomeSocial,
                rg=rg,
                cpf=cpf,
                cnpj=cnpj,
                data_nascimento=nascimento_formatada,
                cor_raca=cor_raca,
                sexo=sexo,
                naturalidade=naturalidade,
                uf=uf,
                especialidade=especialidade_obj,
                conselho1=conselho1,
                conselho2=conselho2,
                conselho3=conselho3,
                conselho4=conselho4,
                num1_conselho=num1_conselho,
                num2_conselho=num2_conselho,
                num3_conselho=num3_conselho,
                num4_conselho=num4_conselho,
                estado_civil=estado_civil,
                complemento=complemento,
                observacao=observacao,
                cep=cep,
                rua=rua,
                numero=numero,
                bairro=bairro,
                cidade=cidade,
                estado=estado,
                telefone=telefone,
                celular=celular,
                nomeEmergencia=nomeEmergencia,
                vinculo=vinculo,
                telEmergencia=telEmergencia,
                email=email,
                ativo=True
            )

            # 2º: Agora que o ID existe, atribua a foto
            if foto:
                profissional.foto = foto
                profissional.save()
    
    profissionais = Profissional.objects.all().order_by('-id')
    especialidades = Especialidade.objects.all()


    return render(request, 'core/profissionais/cadastrar_profissional.html', {
                        'estado_civil_choices': ESTADO_CIVIL,
                        'midia_choices': MIDIA_ESCOLHA,
                        'sexo_choices': SEXO_ESCOLHA,
                        'uf_choices': UF_ESCOLHA,
                        'cor_choices': COR_RACA,
                        'vinculo_choices': VINCULO,
                        'conselho_choices': CONSELHO_ESCOLHA,
                        'especialidade_choices': especialidades,
                        'profissionais': profissionais,
                        }) 

def editar_profissional_view(request):
    ...

def ficha_profissional(request):
    ...

@login_required(login_url='login')
def profissionais_view(request):
    profissionais = Profissional.objects.all().order_by('-id')
    return render(request, 'core/profissionais/profissionais.html', {
        "profissionais": profissionais,
    })


@login_required(login_url='login')
def financeiro_view(request):
    return render(request, 'core/financeiro.html')

@login_required(login_url='login')
def agenda_view(request):
    return render(request, 'core/agendamentos/agenda.html')


@login_required(login_url='login')
def novo_agendamento_view(request):
    return render(request, 'core/agendamentos/novo_agendamento.html')


@login_required(login_url='login')
def configuracao_view(request):

    if request.method == "POST":
        nome = request.POST.get('nome')
        cor = request.POST.get('cor')
        ativo = True
        if nome and cor: 
            try:
                Especialidade.objects.create(nome=nome, cor=cor, ativo=True)
            except Exception as e:
                print("Erro ao salvar especialidade:", e)
            
            
        return redirect('config')
        
    especialidades = Especialidade.objects.all()	
    return render(request, 'core/configuracoes.html', {
        'especialidades': especialidades
    })

