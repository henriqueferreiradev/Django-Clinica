from django.shortcuts import render, redirect, get_object_or_404
from core.models import Agendamento, AvaliacaoFisioterapeutica, CONSELHO_ESCOLHA, COR_RACA, ESTADO_CIVIL, DocumentoClinica, DocumentoProfissional, Especialidade, Evolucao, MIDIA_ESCOLHA, Paciente, Profissional, Prontuario, SEXO_ESCOLHA, UF_ESCOLHA, VINCULO
from datetime import date, datetime, timedelta
from django.http import JsonResponse, HttpResponse 
from django.contrib.auth import get_user_model

from django.contrib.auth.decorators import login_required
from core.utils import registrar_log, get_semana_atual
from dateutil.relativedelta import relativedelta
from django.contrib import messages
from django.db.models import Min, Max,Count 
from django.utils import timezone
 
from django.template.context_processors import request
import json
from core.views.agendamento_views import listar_agendamentos
from core.management.commands.importar_pacientes import parse_date


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
        
        # Validações de CPF e CNPJ
        if Profissional.objects.filter(cpf=cpf).exists():
            messages.error(request, "Já existe um profissional com este CPF.")
            return redirect('cadastrar_profissional')
        
        if cnpj and cnpj.strip():
            if Profissional.objects.filter(cnpj=cnpj).exists():
                messages.error(request, "Já existe um profissional com este CNPJ.")
                return redirect('cadastrar_profissional') 

        nascimento = request.POST.get('nascimento')
        try:
            nascimento_formatada = datetime.strptime(nascimento, "%d/%m/%Y").date()
        except ValueError:
            nascimento_formatada = None
        
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
            print(f"DEBUG VIEW: Antes de criar Profissional")
            print(f"DEBUG VIEW: Email que será salvo: {email}")
            # Cria o profissional - o método save() automaticamente criará o usuário
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
                ativo=True,
                foto=foto  # Agora pode passar a foto diretamente
            )
 
            # O método save() do model já foi chamado pelo create(), então o usuário já foi criado
            messages.success(request, f'Profissional {profissional.nome} cadastrado com sucesso!')
            
            if foto:
                messages.info(request, 'Foto do profissional salva com sucesso!')
            
            registrar_log(usuario=request.user,
                acao='Criação',
                modelo='Profissional',  # Corrigido de 'Paciente' para 'Profissional'
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
        # Capturar o email ANTES de salvar o profissional
        email_antigo = profissional.email
        novo_email = request.POST.get('email')
        
        # Atualização do profissional
        profissional.sobrenome = request.POST.get('sobrenome')
        profissional.nome = request.POST.get('nome')
        profissional.nomeSocial = request.POST.get('nomeSocial')
        profissional.rg = request.POST.get('rg')
        profissional.cpf = request.POST.get('cpf')
        profissional.cnpj = request.POST.get('cnpj')
        
        # Data de nascimento
        nascimento = request.POST.get('nascimento')
        try:
            profissional.data_nascimento = datetime.strptime(nascimento, "%d/%m/%Y").date()
        except ValueError:
            messages.error(request, 'Formato de data inválido (use DD/MM/AAAA)')
            return redirect('editar_profissional', id=id)
            
        profissional.cor_raca = request.POST.get('cor')
        profissional.sexo = request.POST.get('sexo')
        profissional.estado_civil = request.POST.get('estado_civil')
        profissional.naturalidade = request.POST.get('naturalidade')
        profissional.uf = request.POST.get('uf')
        profissional.especialidade_id = request.POST.get('especialidade')
        profissional.especialidade_obj = Especialidade.objects.get(id=profissional.especialidade_id) if profissional.especialidade_id else None
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
        profissional.email = novo_email  # Atualiza o email
        profissional.nomeEmergencia = request.POST.get('nomeEmergencia')
        profissional.vinculo = request.POST.get('vinculo')
        profissional.telEmergencia = request.POST.get('telEmergencia')

        if 'foto' in request.FILES:
            profissional.foto = request.FILES['foto']
            messages.info(request, 'Foto atualizada com sucesso') 
        
        # SALVAR O PROFISSIONAL
        profissional.save()

        # ATUALIZAR O USUÁRIO ASSOCIADO
        if profissional.user:
            try:
                user = profissional.user
                atualizou = False
                
                # Atualizar nome e sobrenome
                if user.first_name != profissional.nome:
                    user.first_name = profissional.nome
                    atualizou = True
                
                if user.last_name != profissional.sobrenome:
                    user.last_name = profissional.sobrenome
                    atualizou = True
                
                # Atualizar email E username (pois username = email)
                if novo_email and novo_email != email_antigo:
                    user.email = novo_email
                    user.username = novo_email  # Importante: username também é email!
                    atualizou = True
                
                # Atualizar senha se a data de nascimento mudou
                data_nascimento_str = profissional.data_nascimento.strftime("%d%m%Y") if profissional.data_nascimento else "123456"
                if not user.check_password(data_nascimento_str):
                    user.set_password(data_nascimento_str)
                    atualizou = True
                    # Nota: se o usuário mudou a senha manualmente, isso vai sobrescrever
                    # Se não quiser isso, remova este bloco
                
                if atualizou:
                    user.save()
                    messages.info(request, 'Usuário atualizado com sucesso!')
                
            except Exception as e:
                messages.warning(request, f'Profissional atualizado, mas houve erro no usuário: {str(e)}')
                print(f"Erro: {e}")
        
        
        # Se não tem usuário mas tem email, criar um novo
        elif not profissional.user and novo_email:
            try:
                data_nascimento_str = profissional.data_nascimento.strftime("%d%m%Y") if profissional.data_nascimento else "123456"
                User = get_user_model()
                # Verificar se já existe usuário com este email
                if User.objects.filter(username=novo_email).exists():
                    # Associar usuário existente
                    user_existente = User.objects.get(username=novo_email)
                    profissional.user = user_existente
                    profissional.save()
                    messages.info(request, 'Profissional associado a usuário existente')
                else:
                    # Criar novo usuário
                    user = User.objects.create_user(
                        username=novo_email,
                        email=novo_email,
                        first_name=profissional.nome,
                        last_name=profissional.sobrenome,
                        password=data_nascimento_str,
                        # Se tiver campos personalizados no User:
                        # tipo='profissional',
                        # ativo=True
                    )
                    profissional.user = user
                    profissional.save()
                    messages.info(request, 'Novo usuário criado automaticamente')
                    
            except Exception as e:
                messages.warning(request, f'Usuário não pôde ser criado: {str(e)}')
                print(f"Erro criação usuário: {e}")

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
    
    if request.method == "POST":
        try:
            tipo_documento = request.POST.get('tipo_documento')
            arquivo = request.FILES.get('arquivo')
            data_vencimento_raw = request.POST.get('data_vencimento')
            data_vencimento = parse_date(data_vencimento_raw) if data_vencimento_raw else None
            observacao = request.POST.get('observacao') or ''
            
            
            
            if not tipo_documento or not arquivo:
                messages.error(request, 'Tipo de documento e arquivo são obrigatórios.')
                return redirect('perfil_profissional', profissional_id=profissional.id)
            
            DocumentoProfissional.objects.create(
                profissional=profissional,
                tipo_documento = tipo_documento,
                arquivo = arquivo,
                data_vencimento = data_vencimento,
                observacao=observacao,
            )
            
            messages.success(request, 'Documento salvo com sucesso.')
            return redirect('perfil_profissional', profissional_id=profissional.id)     
            
           
        except Exception as e:
            print(f'Deu ruim: {e}')    
            
    documentos = DocumentoProfissional.objects.filter(profissional_id=profissional_id)
    print(documentos)
    
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
        'documentos':documentos,
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
 
    # CORREÇÃO AQUI: Pegar o profissional logado em vez do ID fixo
    try:
        profissional = request.user.profissional
        print(f"DEBUG: Profissional logado: {profissional.nome} (ID: {profissional.id})")
    except AttributeError:
        # Se não houver profissional associado ao usuário
        profissional = None
        print("DEBUG: Nenhum profissional associado ao usuário logado")
        messages.error(request, "Nenhum profissional associado ao seu usuário.")
        return redirect('login')  # ou alguma página de erro

    # CORREÇÃO: Filtrar agendamentos pelo profissional logado
    if profissional:
        agendamentos = Agendamento.objects.filter(
            profissional_1=profissional,
            data=dia
        )
        print(f"DEBUG: Agendamentos encontrados para {profissional.nome}: {agendamentos.count()}")
    else:
        agendamentos = Agendamento.objects.none()
        print("DEBUG: Nenhum profissional, retornando agendamentos vazios")

    prontuarios_pendente = 0
    evolucoes_pendente = 0
    avaliacoes_pendente = 0
    
    for agendamento in agendamentos:
        # PRONTUÁRIO
        prontuario = Prontuario.objects.filter(agendamento=agendamento).first()
        if not prontuario or (not prontuario.foi_preenchido and not prontuario.nao_se_aplica):
            prontuarios_pendente += 1
            
        # EVOLUÇÃO (mesma lógica)
        evolucao = Evolucao.objects.filter(agendamento=agendamento).first()
        if not evolucao or (not evolucao.foi_preenchido and not evolucao.nao_se_aplica):
            evolucoes_pendente += 1
            
        # AVALIAÇÃO (mesma lógica)
        avaliacao = AvaliacaoFisioterapeutica.objects.filter(agendamento=agendamento).first()
        if not avaliacao or (not avaliacao.foi_preenchido and not avaliacao.nao_se_aplica):
            avaliacoes_pendente += 1
    
    print(f"DEBUG: Pendências - Prontuários: {prontuarios_pendente}, Evoluções: {evolucoes_pendente}, Avaliações: {avaliacoes_pendente}")
    
    atendimentos_dia = agendamentos.count()

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

    base_params = {
        'q': query or '',
        'di': data_inicio or '',
        'df': data_fim or '',
        'eid': especialidade_id or '',
        'status': status or '',
    }
    prev_params = {'dia': (dia - timedelta(days=1)).isoformat()}
    next_params = {'dia': (dia + timedelta(days=1)).isoformat()}
    
    context = {
        'agendamentos': agendamentos,
        'profissional': profissional,
        'atendimentos_dia': atendimentos_dia,
        'prontuarios_pendente': prontuarios_pendente,
        'evolucoes_pendente': evolucoes_pendente,
        'avaliacoes_pendente': avaliacoes_pendente,
        'dia': dia,
        'prev_url': f"?{urlencode(prev_params)}",
        'next_url': f"?{urlencode(next_params)}",
        'hoje_url': f"?{urlencode({'dia': date.today().isoformat()})}",
    }
    return render(request, 'core/profissionais/agenda_profissional.html', context)