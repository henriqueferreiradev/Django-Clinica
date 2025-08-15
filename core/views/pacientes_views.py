from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_GET
from django.contrib.auth.decorators import login_required
from core.models import User, Paciente,Agendamento,Pagamento,PacotePaciente,RespostaFormulario, Pendencia,Especialidade,ESTADO_CIVIL, MIDIA_ESCOLHA, VINCULO, COR_RACA, UF_ESCOLHA,SEXO_ESCOLHA, CONSELHO_ESCOLHA
from django.utils import timezone
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from datetime import date, datetime, timedelta
from django.db.models import Q, Min, Max,Count,Sum, F, ExpressionWrapper, DurationField
from django.http import JsonResponse 
from dateutil.relativedelta import relativedelta
from django.contrib import messages
from core.utils import get_semana_atual,calcular_porcentagem_formas, registrar_log
from django.conf import settings
from core.tokens import gerar_token_acesso_unico, verificar_token_acesso

import qrcode
import base64
from io import BytesIO






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
            messages.warning(request, f'Paciente {paciente.nome} inativado') 
            registrar_log(usuario=request.user,
                acao='Inativação',
                modelo='Paciente',
                objeto_id=paciente.id,
                descricao=f'Paciente {paciente.nome} inativado.')
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
            messages.success(request, 'Paciente atualizado com sucesso!')
        elif dados['nome']:
            Paciente.objects.create(**dados)
            messages.success(request, 'Paciente cadastrado com sucesso!')
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
 
        # Edição ou criação
        paciente_id = request.POST.get('paciente_id')
        nome = request.POST.get('nome')
        cpf = request.POST.get('cpf')
        nascimento = request.POST.get('nascimento')
        try:
            nascimento_formatada = datetime.strptime(nascimento, "%d/%m/%Y").date()
        except ValueError:
            messages.error(request, 'Formato de data inválido (use DD/MM/AAAA)')  # Adicionar
            return redirect('cadastrar_paciente')
        
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
                messages.info(request, 'Foto do paciente atualizada')
            messages.success(request, f'✅ Paciente {paciente.nome} cadastrado com sucesso!')
            registrar_log(usuario=request.user,
                        acao='Criação',
                        modelo='Paciente',
                        objeto_id=paciente.id,
                        descricao=f'Paciente {paciente.nome} cadastrado.')
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
        novo_cpf = request.POST.get('cpf')
        if Paciente.objects.filter(cpf=novo_cpf).exclude(id=paciente.id).exists():
            messages.error(request, 'CPF já cadastrado para outro paciente!')
            return redirect('editar_paciente', id=paciente.id)
        
        paciente.nome = request.POST.get('nome')
        paciente.sobrenome = request.POST.get('sobrenome')
        paciente.nomeSocial = request.POST.get('nomeSocial')
        paciente.rg = request.POST.get('rg')
        paciente.cpf = request.POST.get('cpf')
        
        nascimento = request.POST.get('nascimento')
        try:
            paciente.data_nascimento = datetime.strptime(nascimento, "%d/%m/%Y").date()
        except (ValueError, TypeError):
            paciente.data_nascimento = None

        paciente.cor_raca = request.POST.get('cor')
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

        paciente.pre_cadastro=False         
        paciente.conferido=True         
        paciente.ativo = True
        if 'foto' in request.FILES:
            paciente.foto = request.FILES['foto']
        
        paciente.save()
        messages.success(request, f'Dados de {paciente.nome} atualizados!')
        print("Conferido:", paciente.conferido)
        print("Pré-cadastro:", paciente.pre_cadastro)   
        
        registrar_log(usuario=request.user,
            acao='Edição',
            modelo='Paciente',
            objeto_id=paciente.id,
            descricao=f'Paciente {paciente.nome} editado.')
        
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



@require_GET
def buscar_pacientes(request):
    termo = request.GET.get('q','').strip()

    resultados = []

    if termo:
        pacientes = Paciente.objects.filter(Q(nome__icontains=termo) | Q(cpf__icontains=termo))[:10]

        resultados = [{'id':p.id, 'nome':p.nome,'sobrenome':p.sobrenome, 'cpf':p.cpf}
                      for p in pacientes]

    return JsonResponse({'resultados': resultados})


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



 
def pre_cadastro(request):
    if request.method == 'POST':
        nome = request.POST.get('nome')
        cpf = request.POST.get('cpf')
        nascimento = request.POST.get('nascimento')
        try:
            nascimento_formatada = datetime.strptime(nascimento, "%d/%m/%Y").date()
        except ValueError:
            messages.error(request, 'Formato de data inválido (use DD/MM/AAAA)')
            return redirect('pre_cadastro')

        foto = request.FILES.get('foto')

        if Paciente.objects.filter(cpf=cpf).exists():
            messages.error(request, "❌ Já existe um paciente com este CPF.")
            return redirect('pre_cadastro')

        paciente = Paciente.objects.create(
            nome=nome,
            sobrenome=request.POST.get('sobrenome'),
            nomeSocial=request.POST.get('nomeSocial'),
            cpf=cpf,
            vinculo=request.POST.get('vinculo'),
            redeSocial=request.POST.get('redeSocial'),
            profissao=request.POST.get('profissao'),
            rg=request.POST.get('rg'),
            data_nascimento=nascimento_formatada,
            cor_raca=request.POST.get('cor'),
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
            ativo=True,
            pre_cadastro=True,         
            conferido=False            
        )

        if foto:
            paciente.foto = foto
            paciente.save()

        # ✅ Criar pendência para profissional responsável
        Pendencia.objects.create(
            tipo='Pré-cadastro',
            descricao=f"Conferir pré-cadastro de {paciente.nome}",
            vinculado_paciente=paciente,
            resolvido=False
        )
    
        messages.success(request, "✅ Pré-cadastro enviado com sucesso! Entraremos em contato.")
        return render(request, 'core/pacientes/pre_cadastro_confirmacao.html')

    return render(request, 'core/pacientes/pre_cadastro.html', {
        'estado_civil_choices': ESTADO_CIVIL,
        'midia_choices': MIDIA_ESCOLHA,
        'sexo_choices': SEXO_ESCOLHA,
        'uf_choices': UF_ESCOLHA,
        'cor_choices': COR_RACA,
        'vinculo_choices': VINCULO,
    })


def pre_cadastro_tokenizado(request, token):
    valido = verificar_token_acesso(token)
    if not valido:
        return render(request, 'core/pacientes/link_expirado.html')   

    return pre_cadastro(request) 



FINALIZADOS = ['desistencia','desistencia_remarcacao','falta_remarcacao','falta_cobrada']
PENDENTES = ['pre','agendado']

def perfil_paciente(request,paciente_id, formulario_id):
    inicio_semana, fim_semana = get_semana_atual()

    paciente = get_object_or_404(Paciente, id=paciente_id)
    pacotes = PacotePaciente.objects.filter(paciente__id=paciente_id,).order_by('-data_inicio')
 
 
    frequencia_semanal = Agendamento.objects.filter(paciente=paciente, data__range=[inicio_semana, fim_semana]).count()
    quantidade_agendamentos = Agendamento.objects.filter(paciente__id=paciente_id).count()
    quantidade_faltas = Agendamento.objects.filter(paciente__id=paciente_id, status__in=FINALIZADOS).count()
    quantidade_repostas = PacotePaciente.objects.filter(paciente__id=paciente_id, eh_reposicao=True).count()
    primeiro_agendamento = Agendamento.objects.filter(paciente__id=paciente_id).aggregate(Min('data'))['data__min']
    ultimo_agendamento = Agendamento.objects.filter(paciente__id=paciente_id).aggregate(Max('data'))['data__max']
    pacote_ativo = PacotePaciente.objects.filter(paciente__id=paciente_id, ativo=True).first()
    data_inicio_pacote_ativo = pacote_ativo.data_inicio if pacote_ativo else 'Sem pacote ativo'
    sessao_atual = pacote_ativo.get_sessao_atual() if pacote_ativo else None
    qtd_total = pacote_ativo.qtd_sessoes if pacote_ativo else None
    progresso = round((sessao_atual / qtd_total) * 100) if qtd_total else 0
    
    
    mais_contratados = Especialidade.objects.annotate(total=Count('agendamento', 
                    filter=Q(agendamento__paciente_id=paciente_id))
                    ).filter(total__gt=0).order_by('-total')

    todos_agendamentos = Agendamento.objects.filter(paciente__id=paciente_id).all()
    agendamentos = (Agendamento.objects
        .filter(paciente__id=paciente_id)
        .annotate(
            duracao_principal=ExpressionWrapper(F('hora_fim') - F('hora_inicio'), output_field=DurationField()),
            duracao_auxiliar=ExpressionWrapper(F('hora_fim_aux') - F('hora_inicio_aux'), output_field=DurationField())
        )
    )

    prof1 = (agendamentos
        .filter(paciente__id=paciente_id, profissional_1__isnull=False)
        .values('profissional_1__id', 'profissional_1__nome', 'profissional_1__foto')
        .annotate(
            total=Count('id'),
            total_horas=Sum('duracao_principal')
        )
    ).order_by('-total')[:3]
    for p in prof1:
        foto = p['profissional_1__foto']
        if foto:
            foto_url = settings.MEDIA_URL + foto
        else:
            foto_url = None
        p['foto_url'] = foto_url
        print(foto_url)

    prof2 = (agendamentos
        .filter(paciente__id=paciente_id, profissional_2__isnull=False)
        .values('profissional_2__id', 'profissional_2__nome', 'profissional_2__foto')
        .annotate(
            total=Count('id'),
            total_horas=Sum('duracao_auxiliar')
        )
    ).order_by('-total')[:3]
    
    for p in prof2:
        foto = p['profissional_2__foto']
        if foto:
            foto_url = settings.MEDIA_URL + foto
        else:
            foto_url = None
        p['foto_url'] = foto_url

    def formatar_duracao(duracao):
        if duracao:
            total_segundos = int(duracao.total_seconds())
            horas = total_segundos // 3600
            minutos = (total_segundos % 3600) // 60
            return f"{horas}h {minutos}min"
        return "0h 0min"

    for item in prof1:
        item['tempo_sessao'] = formatar_duracao(item['total_horas'])

    for item in prof2:
        item['tempo_sessao'] = formatar_duracao(item['total_horas'])
        
        
    pacotes_dados = []

    for pacote in pacotes:
        agendamentos = pacote.agendamento_set.all()

        if agendamentos.exists():
            datas = [ag.data for ag in agendamentos]
            data_inicio = min(datas)
            data_fim = max(datas)
        else:
            data_inicio = pacote.data_inicio
            data_fim = None

        sessoes_realizadas = pacote.sessoes_realizadas
        qtd_total = pacote.qtd_sessoes

        status = "Ativo" if pacote.ativo else "Finalizado"

        pacotes_dados.append({
            'pacote': pacote,
            'data_inicio': data_inicio,
            'data_fim': data_fim,
            'sessoes_realizadas': sessoes_realizadas,
            'qtd_total': qtd_total,
            'status': status,
        })
    
    #PAGAMENTOS
    
    soma_pagamentos = Pagamento.objects.filter(paciente__id=paciente_id,).aggregate(total_pago=(Sum('valor')))
    total = soma_pagamentos['total_pago'] or 0
    total_formatado = f"R$ {total:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
    formas_top3 = (Pagamento.objects.filter(paciente__id=paciente_id,).values('forma_pagamento').annotate(quantidade=Count('id'))
    .order_by('-quantidade')[:5])   
    top_forma_pagamento=calcular_porcentagem_formas(formas_top3)
    ultimos_pagamentos = Pagamento.objects.filter(paciente__id=paciente_id).order_by('-data')[:10]
    debitos_pendentes = PacotePaciente.objects.filter(paciente__id=paciente_id)
    total_debito = sum([p.valor_restante for p in debitos_pendentes])
 
    
    agendamentos_select =Agendamento.objects.filter(paciente=paciente).select_related('observacao_autor').order_by('-data', '-hora_inicio')[:10]


    if request.method == "POST":
        agendamento_id = request.POST.get('agendamento_id')
        observacao = request.POST.get('observacao')



        agendamento = get_object_or_404(Agendamento, id=agendamento_id, paciente=paciente)
        agendamento.observacoes = observacao
        agendamento.observacao_autor = request.user
        agendamento.observacao_data = timezone.now()
        agendamento.save()

        messages.success(request, 'Observação salva com sucesso.')
        return redirect(request.path)
    print('')

    print(todos_agendamentos)
 
    tres_ultimos_agendamentos = Agendamento.objects.filter(paciente__id=paciente_id).order_by('-data')[:3]
        
 
 
    context = {'paciente':paciente,
                'frequencia_semanal':frequencia_semanal,
                'quantidade_agendamentos':quantidade_agendamentos,
                'quantidade_faltas':quantidade_faltas,
                'quantidade_repostas':quantidade_repostas,
                'primeiro_agendamento':primeiro_agendamento,
                'ultimo_agendamento':ultimo_agendamento,
                'pacote_ativo':pacote_ativo,
                'data_inicio_pacote_ativo':data_inicio_pacote_ativo,
                'sessao_atual':sessao_atual,
                'qtd_total':qtd_total,
                'progresso':progresso,
                'pacotes_dados': pacotes_dados,
                'mais_contratados':mais_contratados,
                'profissional_principal':prof1,
                'profissional_auxiliar':prof2,
                'soma_pagamentos':total_formatado,
                'top_forma_pagamento':top_forma_pagamento,
                'ultimos_pagamentos':ultimos_pagamentos,
                'total_debito':total_debito,
                'ultimos_agendamentos':agendamentos_select,
                'todos_agendamentos':todos_agendamentos,
                'tres_ultimos_agendamentos': tres_ultimos_agendamentos,
                }
    return render(request, 'core/pacientes/perfil_paciente.html', context)

@login_required
def gerar_link_publico_precadastro(request):
    token = gerar_token_acesso_unico()
    link = request.build_absolute_uri(f"/pacientes/link/{token}/")

    qr = qrcode.make(link)
    buffer = BytesIO()
    qr.save(buffer, format='PNG')
    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

    
    
    pacientes = Paciente.objects.filter(pre_cadastro=True, ativo=True)
    print(pacientes)
    
    return render(request, 'core/pacientes/link_gerado.html', {
        'link_tokenizado':link,
        'qrcode_base64':img_base64,
        'pacientes':pacientes
    })


 

