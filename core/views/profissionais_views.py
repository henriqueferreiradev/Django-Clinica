from django.shortcuts import render, redirect, get_object_or_404
from core.models import Paciente, Especialidade,Prontuario,Profissional, Servico,PacotePaciente,Agendamento,Pagamento, ESTADO_CIVIL, MIDIA_ESCOLHA, VINCULO, COR_RACA, UF_ESCOLHA,SEXO_ESCOLHA, CONSELHO_ESCOLHA
from datetime import date, datetime, timedelta
from django.http import JsonResponse, HttpResponse 
from django.contrib.auth.decorators import login_required
from core.utils import registrar_log, get_semana_atual
from dateutil.relativedelta import relativedelta
from django.contrib import messages
from django.db.models import Min, Max,Count 
from django.utils import timezone
import json
from core.views.agendamento_views import listar_agendamentos

def cadastrar_profissionais_view(request):
    if request.method == 'POST':
        if 'delete_id' in request.POST:
            delete_id = request.POST.get('delete_id')
            profissional = Profissional.objects.get(id=delete_id)
            profissional.ativo = False
            profissional.save()
            messages.warning(request, f'Profissional {profissional.nome} inativado com sucesso')
            registrar_log(usuario=request.user,
                acao='Inativação',
                modelo='Profissional',
                objeto_id=profissional.id,
                descricao=f'Profissional {profissional.nome} inativado.')
            return redirect('profissionals')
        rg = request.POST.get('rg')
        cpf = request.POST.get('cpf')
        cnpj = request.POST.get('cnpj')
        nome = request.POST.get('nome')
        sobrenome = request.POST.get('sobrenome')
        nomeSocial = request.POST.get('nomeSocial')
        if Profissional.objects.filter(cpf=cpf).exists():
            messages.error(request, "Já existe um profissional com este CPF.")
            return redirect('cadastrar_profissional')
        
        if Profissional.objects.filter(cnpj=cnpj).exists():
            messages.error(request, "Já existe um profissional com este CNPJ.")
            return redirect('cadastrar_profissional') 
        
       

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
                messages.info(request, 'Foto do profissional atualizada') 
            
            messages.success(request, f'Profissional {profissional.nome} cadastrado com sucesso!')
            registrar_log(usuario=request.user,
                acao='Criação',
                modelo='Paciente',
                objeto_id=profissional.id,
                descricao=f'Profissional {profissional.nome} cadastrado.')
            return redirect('cadastrar_profissional')
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
            messages.error(request, 'Formato de data inválido (use DD/MM/AAAA)')  # Adicionar
            return redirect('editar_profissional', id=id)
            
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
            messages.info(request, 'Foto atualizada com sucesso') 
        profissional.save()
        messages.success(request, f'Dados do profissional {profissional.nome} atualizados!')
        registrar_log(usuario=request.user,
                acao='Edição',
                modelo='Profissional',
                objeto_id=profissional.id,
                descricao=f'Profissional {profissional.nome} editado.')
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
    profissionais = Profissional.objects.filter(ativo=True).all().order_by('-id')

    if request.method == 'POST':
        if 'delete_id' in request.POST:
            profissional = Profissional.objects.get(id=request.POST['delete_id'])
            profissional.ativo = False
            profissional.save()
            messages.success(request, f'Profissional {profissional.nome} inativado com sucesso!') 
            registrar_log(usuario=request.user,
                acao='Inativação',
                modelo='Profissional',
                objeto_id=profissional.id,
                descricao=f'Profissional {profissional.nome} inativado.')
            return redirect('profissionais')


    return render(request, 'core/profissionais/profissionais.html', {
        "profissionais": profissionais,
    })



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


FINALIZADOS = ['desistencia','desistencia_remarcacao','falta_remarcacao','falta_cobrada']
PENDENTES = ['pre','agendado']

def perfil_profissional(request, profissional_id):
    inicio_semana, fim_semana = get_semana_atual()

    profissional = get_object_or_404(Profissional, id=profissional_id)
    
    # Agendamentos onde o profissional é o principal
    agendamentos_principal = Agendamento.objects.filter(profissional_1=profissional)
    
    # Agendamentos onde o profissional é auxiliar
    agendamentos_auxiliar = Agendamento.objects.filter(profissional_2=profissional)
    
    # Todos os agendamentos do profissional (como principal ou auxiliar)
    todos_agendamentos = agendamentos_principal | agendamentos_auxiliar
    
    frequencia_semanal = todos_agendamentos.filter(data__range=[inicio_semana, fim_semana]).count()
    quantidade_agendamentos = todos_agendamentos.count()
    quantidade_faltas = todos_agendamentos.filter(status__in=FINALIZADOS).count()
    
    primeiro_agendamento = todos_agendamentos.aggregate(Min('data'))['data__min']
    ultimo_agendamento = todos_agendamentos.aggregate(Max('data'))['data__max']
    
    # Pacientes mais atendidos
    pacientes_mais_atendidos = (todos_agendamentos
        .values('paciente__id', 'paciente__nome', 'paciente__foto')
        .annotate(total=Count('id'))
        .order_by('-total')[:5]
    )
    
    # Especialidades mais utilizadas
    especialidades_mais_utilizadas = (todos_agendamentos
        .values('especialidade__id', 'especialidade__nome')
        .annotate(total=Count('id'))
        .order_by('-total')[:5]
    )
    
    # Prontuários (observações feitas pelo profissional)
    prontuarios = todos_agendamentos.exclude(observacoes='').order_by('-data', '-hora_inicio')
    
    # Últimos 3 agendamentos
    tres_ultimos_agendamentos = todos_agendamentos.order_by('-data')[:3]
    
    context = {
        'profissional': profissional,
        'frequencia_semanal': frequencia_semanal,
        'quantidade_agendamentos': quantidade_agendamentos,
        'quantidade_faltas': quantidade_faltas,
        'primeiro_agendamento': primeiro_agendamento,
        'ultimo_agendamento': ultimo_agendamento,
        'pacientes_mais_atendidos': pacientes_mais_atendidos,
        'especialidades_mais_utilizadas': especialidades_mais_utilizadas,
        'prontuarios': prontuarios,
        'tres_ultimos_agendamentos': tres_ultimos_agendamentos,
        'todos_agendamentos': todos_agendamentos,
    }
    
    return render(request, 'core/profissionais/perfil_profissional.html', context)


from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.db.models import Q
from django.utils import timezone

from datetime import date, timedelta
from urllib.parse import urlencode

@login_required(login_url='login')
def agenda_profissional(request):
    # --- pegar filtros existentes ---
    query = (request.GET.get('q') or '').strip()
    data_inicio = request.GET.get('data_inicio') or None
    data_fim = request.GET.get('data_fim') or None
    especialidade_id = request.GET.get('especialidade_id') or None
    status = request.GET.get('status') or None

    # --- dia selecionado (YYYY-MM-DD) ---
    dia_str = request.GET.get('dia')
    try:
        dia = date.fromisoformat(dia_str) if dia_str else date.today()
    except ValueError:
        dia = date.today()

    # --- descobrir profissional (ou forçar id=1 se ainda estiver testando) ---
    # profissional = getattr(request.user, 'profissional', None) or Profissional.objects.filter(user=request.user).first()
    profissional = Profissional.objects.filter(id=1).first()  # <- seu teste atual

    # base por profissional_1
    agendamentos = Agendamento.objects.filter(profissional_1=profissional)

    # --- filtro do DIA ---
    agendamentos = agendamentos.filter(data=dia)


    # --- demais filtros (opcionais) ---
    if data_inicio:
        agendamentos = agendamentos.filter(data__date__gte=data_inicio)
    if data_fim:
        agendamentos = agendamentos.filter(data__date__lte=data_fim)
    if especialidade_id:
        agendamentos = agendamentos.filter(especialidade_id=especialidade_id)
    if status:
        agendamentos = agendamentos.filter(status=status)
    if query:
        agendamentos = agendamentos.filter(
            Q(paciente__nome__icontains=query) | Q(observacoes__icontains=query)
        )

    agendamentos = agendamentos.select_related('paciente','profissional_1','servico') \
                                .order_by('hora_inicio')

    # --- construir prev/next preservando filtros atuais ---
    base_params = {
        'q': query or '',
        'data_inicio': data_inicio or '',
        'data_fim': data_fim or '',
        'especialidade_id': especialidade_id or '',
        'status': status or '',
    }
    prev_params = base_params | {'dia': (dia - timedelta(days=1)).isoformat()}
    next_params = base_params | {'dia': (dia + timedelta(days=1)).isoformat()}
    
    context = {
        'agendamentos': agendamentos,
        'profissional': profissional,
        'dia': dia,  # para exibir formatado
        'prev_url': f"?{urlencode(prev_params)}",
        'next_url': f"?{urlencode(next_params)}",
        'hoje_url': f"?{urlencode(base_params | {'dia': date.today().isoformat()})}",
    }
    return render(request, 'core/profissionais/agenda_profissional.html', context)


def salvar_prontuario(request):
    try:
        dados = json.loads(request.body)

        prontuario = Prontuario.objects.create(
            paciente_id = dados.get('paciente_id'),
            pacote_id = dados.get('pacote_id'),
            agndamento_id = dados.get('agendamento_id'),
            profissional_id = dados.get('profissional_id'),
            
            historico_doenca = dados.get('historico_doenca',''),
            exame_fisico = dados.get('exame_fisico',''),
            conduta = dados.get('conduta',''),
            diagnostico = dados.get('diagnostico',''),
            observacoes = dados.get('observacoes',''),
        )

        return JsonResponse({
            'sucess':True,
            'prontuario_id':prontuario.id,
            'message':'Prontuário salvo com sucesso!'
        })


        ...
    except Exception as e:
                return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)
