from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout
from django.http import JsonResponse
from .forms import LoginForm, RegisterForm
from django.contrib import messages
from django.contrib.auth.forms import AuthenticationForm
from .models import Paciente, Especialidade,Profissional, Servico, ESTADO_CIVIL, MIDIA_ESCOLHA, VINCULO, COR_RACA, UF_ESCOLHA,SEXO_ESCOLHA, CONSELHO_ESCOLHA
from django.db.models import Q
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.views.decorators.csrf import csrf_exempt 
from django.views.decorators.http import require_GET
from django.contrib.auth.decorators import login_required
from datetime import date, datetime, timedelta
from django.utils import timezone
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
        "profissao":paciente.profissao,
        "redeSocial":paciente.redeSocial,
        "ativo": paciente.ativo
    }
    return JsonResponse(data)

def dados_profissional(request, profissional_id):
    profissional = get_object_or_404(Profissional, id=profissional_id)
    
    if profissional.data_nascimento:
        nascimento = profissional.data_nascimento
        hoje = date.today()
        idade = relativedelta(hoje, nascimento)
        idade_formatada = f'{idade.years} anos, {idade.months} meses e {idade.days} dias'

    data = {
        "nome": profissional.nome,
        "sobrenome": profissional.sobrenome,
        "nomeSocial": profissional.nomeSocial,
        "rg": profissional.rg,
        "cpf": profissional.cpf,
        "nascimento": profissional.data_nascimento.strftime('%d/%m/%Y') if profissional.data_nascimento else "",
        "idade":idade_formatada,
        "cor_raca": profissional.get_cor_raca_display(),  
        "sexo": profissional.get_sexo_display(),
        "estado_civil": profissional.get_estado_civil_display(),
        "naturalidade": profissional.naturalidade,
        "uf": profissional.uf,
        "foto": profissional.foto.url if profissional.foto else "",
        "observacao": profissional.observacao,
        "cep": profissional.cep,
        "rua": profissional.rua,
        "numero": profissional.numero,
        "complemento": profissional.complemento,
        "bairro": profissional.bairro,
        "cidade": profissional.cidade,
        "estado": profissional.estado,
        "telefone": profissional.telefone,
        "celular": profissional.celular,
        "email": profissional.email,
        "nomeEmergencia": profissional.nomeEmergencia,
        "vinculo": profissional.get_vinculo_display(),
        "telEmergencia": profissional.telEmergencia,
        "ativo": profissional.ativo,
        "cnpj":profissional.cnpj,
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
    # Opções de filtro
    mostrar_todos = request.GET.get('mostrar_todos') == 'on'
    filtra_inativo = request.GET.get('filtra_inativo') == 'on'
    query = request.GET.get('q', '').strip()
    periodo = request.GET.get('periodo', '')
    hoje = timezone.now().date()

    # Processa submissão de formulário (POST)
    if request.method == 'POST':
        if 'delete_id' in request.POST:
            paciente = Paciente.objects.get(id=request.POST['delete_id'])
            paciente.ativo = False
            paciente.save()
            return redirect('pacientes')

        paciente_id = request.POST.get('paciente_id')
        dados = {
            'nome': request.POST.get('nome'),
            'cpf': request.POST.get('cpf'),
            'telefone': request.POST.get('telefone'),
            'rg': request.POST.get('rg'),
            'data_nascimento': request.POST.get('nascimento'),
            'cor_raca': request.POST.get('cor'),
            'sexo': request.POST.get('sexo'),
            'naturalidade': request.POST.get('naturalidade'),
            'uf': request.POST.get('uf'),
            'nomeSocial': request.POST.get('nomeSocial'),
            'estado_civil': request.POST.get('estado_civil'),
            'midia': request.POST.get('midia'),
            'cep': request.POST.get('cep'),
            'rua': request.POST.get('rua'),
            'numero': request.POST.get('numero'),
            'bairro': request.POST.get('bairro'),
            'cidade': request.POST.get('cidade'),
            'estado': request.POST.get('estado'),
            'celular': request.POST.get('celular'),
            'telEmergencia': request.POST.get('telEmergencia'),
            'email': request.POST.get('email'),
            'observacao': request.POST.get('observacao'),
            'ativo': True,
        }

        if paciente_id:
            Paciente.objects.filter(id=paciente_id).update(**dados)
        elif dados['nome']:
            Paciente.objects.create(**dados)

        return redirect('pacientes')

    # Inicia o queryset
    if mostrar_todos:
        pacientes = Paciente.objects.all()
    elif filtra_inativo:
        pacientes = Paciente.objects.filter(ativo=False)
    else:
        pacientes = Paciente.objects.filter(ativo=True)

    # Filtro por texto (nome ou CPF)
    if query:
        pacientes = pacientes.filter(Q(nome__icontains=query) | Q(cpf__icontains=query))

    # Filtro por período de data de cadastro
    if periodo:
        dias = {
            'semana': 7,
            'mes': 30,
            'semestre': 180,
            'ano': 365
        }.get(periodo)
        if dias:
            data_inicio = hoje - timedelta(days=dias)
            pacientes = pacientes.filter(data_cadastro__gte=data_inicio)

    # Ordenação final
    pacientes = pacientes.order_by('-id')

    # Total de pacientes ativos (independente do filtro atual)
    total_ativos = Paciente.objects.filter(ativo=True).count()
    total_filtrados = pacientes.count()

    return render(request, 'core/pacientes/pacientes.html', {
        'pacientes': pacientes,
        'query': query,
        'total_ativos': total_ativos,
         'total_filtrados': total_filtrados,
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
            messages.success(request, f'O paciente {paciente.nome} foi inativado com sucesso.')
            return redirect('pacientes')

        # Edição ou criação
        paciente_id = request.POST.get('paciente_id')
        nome = request.POST.get('nome')
        cpf = request.POST.get('cpf')
        nascimento = request.POST.get('nascimento')
        try:
            nascimento_formatada = datetime.strptime(nascimento, "%d/%m/%Y").date()
        except ValueError:
            ...
        foto = request.FILES.get('foto')

        
        if Paciente.objects.filter(cpf=cpf).exists():
            messages.error(request, "❌ Já existe um paciente com este CPF.")
            return redirect('cadastrar_paciente')  # Aqui ele deve sair da função

        if nome:
            paciente = Paciente.objects.create(
                nome=nome,
                sobrenome=request.POST.get('sobrenome'),
                nomeSocial=request.POST.get('nomeSocial'),
                cpf = request.POST.get('cpf'),
                vinculo=request.POST.get('vinculo'),
                redeSocial=request.POST.get('redeSocial'),
                profissao=request.POST.get('profissao'),
                rg=request.POST.get('rg'),
                data_nascimento=nascimento_formatada,
                cor_raca=request.POST.get('cor_raca'),
                sexo=request.POST.get('sexo'),
                naturalidade=request.POST.get('naturalidade'),
                uf=request.POST.get('uf'),
                estado_civil=request.POST.get('estado_civil'),
                complemento=request.POST.get('complemento'),
                midia=request.POST.get('midia'),
                cep=request.POST.get('cep'),
                rua=request.POST.get('rua'),
                numero=request.POST.get('numero'),
                bairro=request.POST.get('bairro'),
                cidade=request.POST.get('cidade'),
                estado=request.POST.get('estado'),
                telefone=request.POST.get('telefone'),
                celular=request.POST.get('celular'),
                nomeEmergencia=request.POST.get('nomeEmergencia'),
                telEmergencia=request.POST.get('telEmergencia'),
                email=request.POST.get('email'),
                observacao=request.POST.get('observacao'),
                ativo=True
            )
            print(request.POST.get("cor_raca"))
            if foto:
                paciente.foto = foto
                paciente.save()

            messages.success(request, f'✅ Paciente {paciente.nome} cadastrado com sucesso!')
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

@login_required(login_url='login')
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
        paciente.profissao = request.POST.get('profissao')
        paciente.redeSocial = request.POST.get('redeSocial')
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

        paciente.ativo = True
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

def editar_profissional_view(request, id):


    profissional = get_object_or_404(Profissional, id=id)

    if request.method == 'POST':
        if 'delete_id' in request.POST:
            delete_id = request.POST.get('delete_id')
            profissional = Profissional.objects.get(id=delete_id)
            profissional.ativo = False
            profissional.save()
            return redirect('profissionais')

        # Criação de novo profissional
        profissional.sobrenome = request.POST.get('sobrenome')
        profissional.nome = request.POST.get('nome')
        profissional.nomeSocial = request.POST.get('nomeSocial')
        profissional.rg = request.POST.get('rg')
        profissional.cpf = request.POST.get('cpf')
        profissional.cnpj = request.POST.get('cnpj')
        nascimento = request.POST.get('nascimento')
        try:
            profissional.nascimento_formatada = datetime.strptime( nascimento, "%d/%m/%Y").date()
        except ValueError:
            profissional.nascimento_formatada = None 
        profissional.cor_raca = request.POST.get('cor')
    
        profissional.sexo = request.POST.get('sexo')
        profissional.estado_civil = request.POST.get('estado_civil')
        profissional.naturalidade = request.POST.get('naturalidade')
        profissional.uf = request.POST.get('uf')
        profissional.especialidade_id = request.POST.get('especialidade')
        profissional.especialidade_obj = Especialidade.objects.get(id= profissional.especialidade_id) if  profissional.especialidade_id else None
        profissional.conselho1 = request.POST.get('conselho1')
        profissional.conselho2 = request.POST.get('conselho2')
        profissional.conselho3 = request.POST.get('conselho3')
        profissional.conselho4 = request.POST.get('conselho4')

        profissional.num1_conselho = request.POST.get("num1_conselho")
        profissional.num2_conselho = request.POST.get("num2_conselho")
        profissional.num3_conselho = request.POST.get("num3_conselho")
        profissional.num4_conselho = request.POST.get("num4_conselho")

        profissional.observacao = request.POST.get('observacao')

        profissional.cep = request.POST.get('cep')
        profissional.rua = request.POST.get('rua')
        profissional.numero = request.POST.get('numero')
        profissional.complemento = request.POST.get('complemento')
        profissional.bairro = request.POST.get('bairro')
        profissional.cidade = request.POST.get('cidade')
        profissional.estado = request.POST.get('estado')

        profissional.telefone = request.POST.get('telefone')
        profissional.celular = request.POST.get('celular')
        profissional.email = request.POST.get('email')
        profissional.nomeEmergencia = request.POST.get('nomeEmergencia')
        profissional.vinculo = request.POST.get('vinculo')
        profissional.telEmergencia = request.POST.get('telEmergencia')


        if 'foto' in request.FILES:
            profissional.foto = request.FILES['foto']

        profissional.save()
        
        return redirect('profissionais')  
    

    especialidades = Especialidade.objects.all()
    context = {
        'profissional': profissional,
        'estado_civil_choices': ESTADO_CIVIL,
        'midia_choices': MIDIA_ESCOLHA,
        'sexo_choices': SEXO_ESCOLHA,
        'uf_choices': UF_ESCOLHA,
        'cor_choices': COR_RACA,
        'vinculo_choices': VINCULO,
        'conselho_choices': CONSELHO_ESCOLHA,
        'especialidade_choices': especialidades, 
                        
    }
    return render(request, 'core/profissionais/editar_profissional.html', context)

def ficha_profissional(request,id ):
    profissional = get_object_or_404(Profissional, id=id)
    return render(request, 'core/profissionais/ficha_profissional.html', {'profissional': profissional})


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
    horarios = []
    for h in range(8, 20):  # de 08h às 19h30
        horarios.append(f"{h:02d}:00")
        horarios.append(f"{h:02d}:30")
    
    especialidades = Especialidade.objects.all()
    profissionais = Profissional.objects.all()

    context = {
        'horarios': horarios,
        'especialidade_choices': especialidades,
        'profissionais': profissionais,
    }
    return render(request, 'core/agendamentos/agenda.html', context)


@login_required(login_url='login')
def novo_agendamento_view(request):
    return render(request, 'core/agendamentos/novo_agendamento.html')


@login_required(login_url='login')
def configuracao_view(request):

    if request.method == "POST":
        tipo = request.POST.get('tipo')

        if tipo == "especialidade":
            nome = request.POST.get('nome')
            cor = request.POST.get('cor')
            if nome and cor:
                try:
                    Especialidade.objects.create(nome=nome, cor=cor, ativo=True)
                except Exception as e:
                    print("Erro ao salvar especialidade:", e)

        elif tipo == "servico":
            nome = request.POST.get('nome')
            valor = request.POST.get('valor')
            if nome and valor:
                try:
                    valor = float(valor.replace(',', '.'))
                    Servico.objects.create(nome=nome, valor=valor, ativo=True)
                except Exception as e:
                    print("Erro ao salvar serviço:", e)
        return redirect('config')
        
    especialidades = Especialidade.objects.all()	
    servicos = Servico.objects.filter(ativo=True)
    return render(request, 'core/configuracoes.html', {
        'especialidades': especialidades,
        'servicos': servicos,
        
    })


@require_GET
def buscar_pacientes(request):
    termo = request.GET.get('q','').strip()

    resultados = []

    if termo:
        pacientes = Paciente.objects.filter(Q(nome__icontains=termo) | Q(cpf__icontains=termo))[:10]

        resultados = [{'id':p.id, 'nome':p.nome,'sobrenome':p.sobrenome, 'cpf':p.cpf}
                      for p in pacientes]

    return JsonResponse({'resultados': resultados})

 