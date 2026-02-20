from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_GET
from django.contrib.auth.decorators import login_required
from core.models import Agendamento, COR_RACA, ESTADO_CIVIL, AvaliacaoFisioterapeutica, Especialidade, Evolucao, FrequenciaMensal, HistoricoStatus, Lembrete, MIDIA_ESCOLHA, NotaFiscalEmitida, Notificacao, Paciente, PacotePaciente, Pagamento, Pendencia, Prontuario, Receita, RespostaFormulario, RespostaPergunta, SEXO_ESCOLHA, Servico, TIPO_VINCULO, UF_ESCOLHA, User, VINCULO, VinculoFamiliar
from django.utils import timezone
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from datetime import date, datetime, timedelta
from django.db.models import Q, Min, Max,Count,Sum, F, ExpressionWrapper, DurationField
from django.http import JsonResponse 
from dateutil.relativedelta import relativedelta
from django.contrib import messages
from django.db.models.functions import ExtractYear
from core.utils import get_semana_atual,calcular_porcentagem_formas, registrar_log
from django.conf import settings
from django.template.context_processors import request
from core.tokens import gerar_token_acesso_unico, rate_limit_ip, verificar_token_acesso
import qrcode
import base64
from io import BytesIO
from core.views.frequencia_views import sync_frequencias_mes
from .notificacoes_views import marcar_notificacao_lida
 
def calcular_idade(data_nascimento):
    hoje = date.today()
    idade = hoje.year - data_nascimento.year
    if (hoje.month, hoje.day) < (data_nascimento.month, data_nascimento.day):
        idade -= 1
    return idade

def pacientes_view(request):
    if request.method == 'POST':
        pac_id = request.POST.get('delete_id') or request.POST.get('inativar_id')
        if pac_id:
            paciente = get_object_or_404(Paciente, id=pac_id)

            if paciente.ativo:
                paciente.ativo = False
                paciente.save(update_fields=['ativo'])
                messages.success(request, f'Paciente {paciente.nome} inativado.')
                try:
                    registrar_log(
                        usuario=request.user,
                        acao='Inativação',
                        modelo='Paciente',
                        objeto_id=paciente.id,
                        descricao=f'Paciente {paciente.nome} inativado.'
                    )
                except Exception:
                    pass
            else:
                messages.info(request, f'{paciente.nome} já está inativo.')

        return redirect('pacientes')
    
    query = request.GET.get('q', '').strip()
    situacao = request.GET.get('situacao', '').strip()
    status = request.GET.get('status', '').strip()
    data_inicio = request.GET.get('data_inicio')
    data_fim = request.GET.get('data_fim')
  
    print(status)
    hoje = timezone.now().date()
    mes, ano = hoje.month, hoje.year
    sync_frequencias_mes(mes, ano)

    pacientes = Paciente.objects.all()



    # Filtro por status
 
    if situacao == 'inativo':
        pacientes = pacientes.filter(ativo=False, pre_cadastro=False)
    elif situacao == 'pendente':
        pacientes = pacientes.filter(pre_cadastro=True, ativo=False)   
    else:
        pacientes = pacientes = Paciente.objects.filter(ativo=True)

    if status:
        status = str(status).lower().strip()
        pacientes = pacientes.filter(
            frequencias__mes=mes,
            frequencias__ano=ano,
            frequencias__status=status
        ).distinct()

        print(pacientes.query)
    # Filtro por nome ou CPF
    if query:
        pacientes = pacientes.filter(
            Q(nome__icontains=query) | Q(cpf__icontains=query)
        )

    # Filtro por período de datas
    if data_inicio:
        pacientes = pacientes.filter(data_cadastro__gte=data_inicio)
    if data_fim:
        pacientes = pacientes.filter(data_cadastro__lte=data_fim)

    # Ordenação final
    pacientes = pacientes.order_by('-id')

    # Totais (antes da paginação)
    total_ativos = Paciente.objects.filter(ativo=True).count()
    total_filtrados = pacientes.count()
    pacientes_ativos = Paciente.objects.filter(ativo=True).order_by('-id')
    # PAGINAÇÃO - EXATAMENTE COMO NO CONTAS A RECEBER
    paginator = Paginator(pacientes, 11)  # 10 pacientes por página
    page_number = request.GET.get('page')
    
    try:
        page_obj = paginator.get_page(page_number)
    except PageNotAnInteger:
        page_obj = paginator.get_page(1)
    except EmptyPage:
        page_obj = paginator.get_page(paginator.num_pages)


    return render(request, 'core/pacientes/pacientes.html', {
        'page_obj': page_obj,
        'query': query,
        'situacao': situacao,
        'data_inicio': data_inicio,
        'data_fim': data_fim,
        'total_ativos': total_ativos,
        'total_filtrados': total_filtrados,
        
    })

@login_required(login_url='login')
def cadastrar_pacientes_view(request):
    if request.method == 'POST':
        consentimento_tratamento = request.POST.get('consentimento_tratamento') == 'true'
        consentimento_imagem = request.POST.get('consentimento_imagem') == 'true'
        consent_marketing = request.POST.get('consentimento_marketing') == 'true'
        nf_nao_aplica = request.POST.get('nf_nao_aplica') == 'true'
        nf_imposto_renda =request.POST.get('nf_imposto_renda') == 'true'
        nf_reembolso_plano =request.POST.get('nf_reembolso_plano') == 'true'
        
        politica_ver = request.POST.get('politica_privacidade_versao') or 'v1.0-2025-08-20'
        
        print(consentimento_tratamento)
        print(consentimento_imagem)
        print(consent_marketing)
        print(nf_nao_aplica)
        print(nf_imposto_renda)
        print(nf_reembolso_plano)
        
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
                consentimento_tratamento=consentimento_tratamento,
                consentimento_lgpd=consentimento_imagem,
                consentimento_marketing=consent_marketing,
                politica_privacidade_versao=politica_ver,
                data_consentimento=timezone.now(),
                ip_consentimento=request.META.get('REMOTE_ADDR'),
                nf_nao_aplica = nf_nao_aplica,
                nf_imposto_renda = nf_imposto_renda,
                nf_reembolso_plano = nf_reembolso_plano,
                pre_cadastro=False,         
                conferido=True,
                ativo=True,
            )
            print(request.POST.get("cor_raca"))
            
            
            if foto:
                paciente.foto = foto
                paciente.save() 
                messages.info(request, 'Foto do paciente atualizada')
            messages.success(request, f'Paciente {paciente.nome} cadastrado com sucesso!')
            
            registrar_log(usuario=request.user,
                        acao='Criação',
                        modelo='Paciente',
                        objeto_id=paciente.id,
                        descricao=f'Paciente {paciente.nome} cadastrado.')
            
            idade = calcular_idade(nascimento_formatada)
            eh_menor = idade < 18

            if eh_menor:
                resp_nascimento = request.POST.get('resp_nascimento')

                try: 
                    resp_nascimento_dt = datetime.strptime(resp_nascimento, '%d/%m/%Y').date()
                except ValueError:
                    messages.error(request, 'Data de nascimento do responsável inválida')
                    raise Exception('Data inválida responsável')


                resp_cpf = request.POST.get('resp_cpf')

                responsavel = Paciente.objects.filter(cpf=resp_cpf).first()

                if not responsavel:
                    responsavel = Paciente.objects.create(
                        nome=request.POST.get('resp_nome'),
                        sobrenome=request.POST.get('resp_sobrenome'),
                        nomeSocial=request.POST.get('resp_nomeSocial'),
                        cpf=resp_cpf,
                        rg=request.POST.get('resp_rg'),
                        data_nascimento=resp_nascimento_dt,
                        cor_raca=request.POST.get('resp_cor'),
                        sexo=request.POST.get('resp_sexo'),
                        estado_civil=request.POST.get('resp_estado_civil'),
                        profissao=request.POST.get('resp_profissao'),
                        naturalidade=request.POST.get('resp_naturalidade'),
                        uf=request.POST.get('resp_uf'),
                        midia=request.POST.get('resp_midia'),
                        redeSocial=request.POST.get('resp_redeSocial'),
                        observacao=request.POST.get('resp_observacao'),
                        cep=request.POST.get('cep'),  # copia endereço
                        rua=request.POST.get('rua'),
                        numero=request.POST.get('numero'),
                        complemento=request.POST.get('complemento'),
                        bairro=request.POST.get('bairro'),
                        cidade=request.POST.get('cidade'),
                        estado=request.POST.get('estado'),
                        telefone=request.POST.get('telefone'),
                        celular=request.POST.get('celular'),
                        consentimento_tratamento=consentimento_tratamento,
                        consentimento_lgpd=consentimento_imagem,
                        consentimento_marketing=consent_marketing,
                        politica_privacidade_versao=politica_ver,
                        data_consentimento=timezone.now(),
                        ip_consentimento=request.META.get('REMOTE_ADDR'),
                        nf_nao_aplica = nf_nao_aplica,
                        nf_imposto_renda = nf_imposto_renda,
                        nf_reembolso_plano = nf_reembolso_plano,
                        pre_cadastro=False,         
                        conferido=True,
                        ativo=True,
                     

                    )
                if request.FILES.get('resp_foto'):
                    responsavel.foto = request.FILES['resp_foto']
                    responsavel.save()
                
            
                VinculoFamiliar.objects.create(
                    paciente=paciente,
                    familiar=responsavel,
                    tipo=request.POST.get('resp_vinculo'),
                    responsavel_legal = True,
                )

            messages.success(request, 'Paciente cadastrado com sucesso!')
            return redirect('pacientes')
   

    return render(request, 'core/pacientes/cadastrar_paciente.html', {
  
 
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

        consentimento_tratamento = request.POST.get('consentimento_tratamento') == 'true'
        consentimento_lgpd = request.POST.get('consentimento_imagem') == 'true'
        consentimento_marketing = request.POST.get('consentimento_marketing') == 'true'
        print(consentimento_marketing, consentimento_lgpd, consentimento_tratamento)

        paciente.consentimento_tratamento = consentimento_tratamento
        paciente.consentimento_lgpd = consentimento_lgpd
        paciente.consentimento_marketing = consentimento_marketing
        paciente.nf_nao_aplica = request.POST.get('nf_nao_aplica') == 'true'
        paciente.nf_imposto_renda =request.POST.get('nf_imposto_renda') == 'true'
        paciente.nf_reembolso_plano =request.POST.get('nf_reembolso_plano') == 'true'    
        paciente.ativo = True

        

        if 'foto' in request.FILES:
            paciente.foto = request.FILES['foto']
        
        paciente.save()
        messages.success(request, f'Dados de {paciente.nome} atualizados!')

        notificacao = Notificacao.objects.filter(
            paciente=paciente,
            usuario=request.user,
            lida=False
        ).first()

        if notificacao:
            notificacao.lida = True
            notificacao.save()


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
        pacientes = Paciente.objects.filter( Q(nome__icontains=termo) | Q(cpf__icontains=termo), ativo=True )[:10]

        resultados = [{'id':p.id, 
                       'nome':p.nome,
                       'sobrenome':p.sobrenome, 
                       'cpf':p.cpf,
                       }
                      for p in pacientes]

    return JsonResponse({'resultados': resultados})

@require_GET
def servicos_paciente(request, paciente_id):
    receitas = (
        Receita.objects
        .filter(paciente_id=paciente_id, status__in=['pago','pendente'])
        .select_related('pacote__servico')
    )
    print(receitas)
    servicos = []
    for r in receitas:
        servicos.append({
            'id': r.id,
            'nome': f'{r.pacote.servico.nome} ({r.pacote.servico.qtd_sessoes} sessões)',
            'valor': float(r.valor),
            'data_pagamento': r.ultimo_pagamento.strftime('%d/%m/%Y') if r.ultimo_pagamento else ''
        })
        print(servicos)
    return JsonResponse({'servicos': servicos})

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
        if not rate_limit_ip(
                request,
                prefixo='pre_cadastro',
                limite=5,
                janela=3600  
                ):
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({
                    'ok': False,
                    'erro': 'Muitas tentativas. Aguarde e tente novamente.'
                    }, status=429)


            messages.error(request, 'Muitas tentativas. Aguarde e tente novamente.')
            return redirect('pre_cadastro')


        consentimento_tratamento = request.POST.get('consentimento_tratamento') == 'true'
        consentimento_imagem = request.POST.get('consentimento_imagem') == 'true'
        consent_marketing = request.POST.get('consentimento_marketing') == 'true'
        nf_nao_aplica = request.POST.get('nf_nao_aplica') == 'true'
        nf_imposto_renda =request.POST.get('nf_imposto_renda') == 'true'
        nf_reembolso_plano =request.POST.get('nf_reembolso_plano') == 'true'
        politica_ver = request.POST.get('politica_privacidade_versao') or 'v1.0-2025-08-20'
        
        is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest'

        if not consentimento_tratamento:
            if is_ajax:
                return JsonResponse({
                    'ok': False,
                    'erro': 'Você precisa aceitar o termo de consentimento (LGPD)'
                }, status=400)

 
            
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
            consentimento_tratamento=consentimento_tratamento,
            consentimento_lgpd=consentimento_imagem,
            consentimento_marketing=consent_marketing,
            politica_privacidade_versao=politica_ver,
            data_consentimento=timezone.now(),
            ip_consentimento=request.META.get('REMOTE_ADDR'),
            nf_nao_aplica = nf_nao_aplica,
            nf_imposto_renda = nf_imposto_renda,
            nf_reembolso_plano = nf_reembolso_plano,
            pre_cadastro=True,         
            conferido=False,
            ativo=False,   
        )

        if foto:
            paciente.foto = foto
            paciente.save()

        # Lógica para responsável (se paciente for menor)
        idade = calcular_idade(nascimento_formatada)
        eh_menor = idade < 18

        if eh_menor:
            resp_nascimento = request.POST.get('resp_nascimento')

            try: 
                resp_nascimento_dt = datetime.strptime(resp_nascimento, '%d/%m/%Y').date()
            except ValueError:
                messages.error(request, 'Data de nascimento do responsável inválida')
                paciente.delete()  # Deleta o paciente criado pois há erro no responsável
                return redirect('pre_cadastro')

            resp_cpf = request.POST.get('resp_cpf')

            responsavel = Paciente.objects.filter(cpf=resp_cpf).first()

            if not responsavel:
                responsavel = Paciente.objects.create(
                    nome=request.POST.get('resp_nome'),
                    sobrenome=request.POST.get('resp_sobrenome'),
                    nomeSocial=request.POST.get('resp_nomeSocial'),
                    cpf=resp_cpf,
                    rg=request.POST.get('resp_rg'),
                    data_nascimento=resp_nascimento_dt,
                    cor_raca=request.POST.get('resp_cor'),
                    sexo=request.POST.get('resp_sexo'),
                    estado_civil=request.POST.get('resp_estado_civil'),
                    profissao=request.POST.get('resp_profissao'),
                    naturalidade=request.POST.get('resp_naturalidade'),
                    uf=request.POST.get('resp_uf'),
                    midia=request.POST.get('resp_midia'),
                    redeSocial=request.POST.get('resp_redeSocial'),
                    observacao=request.POST.get('resp_observacao'),
                    cep=request.POST.get('resp_cep', request.POST.get('cep')),
                    rua=request.POST.get('resp_rua', request.POST.get('rua')),
                    numero=request.POST.get('resp_numero', request.POST.get('numero')),
                    complemento=request.POST.get('resp_complemento', request.POST.get('complemento')),
                    bairro=request.POST.get('resp_bairro', request.POST.get('bairro')),
                    cidade=request.POST.get('resp_cidade', request.POST.get('cidade')),
                    estado=request.POST.get('resp_estado', request.POST.get('estado')),
                    telefone=request.POST.get('resp_telefone'),
                    celular=request.POST.get('resp_celular'),
                    consentimento_tratamento=consentimento_tratamento,
                    consentimento_lgpd=consentimento_imagem,
                    consentimento_marketing=consent_marketing,
                    politica_privacidade_versao=politica_ver,
                    data_consentimento=timezone.now(),
                    ip_consentimento=request.META.get('REMOTE_ADDR'),
                    nf_nao_aplica=nf_nao_aplica,
                    nf_imposto_renda=nf_imposto_renda,
                    nf_reembolso_plano=nf_reembolso_plano,
                    pre_cadastro=True,  # Mantém como pré-cadastro
                    conferido=False,
                    ativo=False,
                )
            
            if request.FILES.get('resp_foto'):
                responsavel.foto = request.FILES['resp_foto']
                responsavel.save()
            
            VinculoFamiliar.objects.create(
                paciente=paciente,
                familiar=responsavel,
                tipo=request.POST.get('resp_vinculo'),
                responsavel_legal=True,
            )
            if eh_menor:
                Notificacao.objects.create(
                    usuario=request.user,
                    paciente=responsavel,
                    titulo='Responsável por paciente menor de idade',
                    mensagem=(
                        f'Você foi cadastrado como responsável legal pelo paciente '
                        f'{paciente.nome}. É necessário conferir os dados do dependente.'
                    ),
                    tipo='alerta',
                    url=f'/pacientes/editar/{paciente.id}/',
                )

                Lembrete.objects.create(
                    usuario=request.user,
                    tipo_evento='cadastro',
                    origem='pre_cadastro_responsavel',
                    data_disparo=timezone.now() + timedelta(days=1),
                    titulo='Pré-cadastro de dependente pendente',
                    mensagem=(
                        f'O pré-cadastro do dependente {paciente.nome} '
                        'ainda não foi conferido.'
                    ),
                    paciente=paciente
                )

                            
                
        Notificacao.objects.create(
            usuario=request.user,
            paciente=paciente,
            titulo='Novo pré-cadastro realizado',
            mensagem=(f'O paciente {paciente.nome} realizou um pré-cadastro.'
                      'É necessário conferir e confirmar os dados.'),
            tipo='alerta',
            url=f'/pacientes/editar/{paciente.id}/',
        )
    
        Lembrete.objects.create(
            usuario=request.user,
            tipo_evento='cadastro',
            origem='pre_cadastro',
            data_disparo=timezone.now() + timedelta(days=1),
            titulo='Pré-cadastro pendente de conferência',
            mensagem=(
                f'O pré-cadastro do paciente {paciente.nome} '
                'ainda não foi conferido.'
            ),
            paciente=paciente
        )
        registro = getattr(request, "token_publico", None)
        registro.usado_em = timezone.now()
        registro.ip_uso = request.META.get('REMOTE_ADDR')
        registro.save()
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
    registro, status = verificar_token_acesso(
        token,
        ip=request.META.get('REMOTE_ADDR')
    )

    if status == "expirado":
        return render(request, 'core/pacientes/pre-cadastro/link_expirado.html')

    if status == "ja_utilizado":
        return render(request, 'core/pacientes/pre-cadastro/link_utilizado.html')

    if status != "ok":
        return render(request, 'core/pacientes/pre-cadastro/link_invalido.html')

    request.token_publico = registro  # injeta no request
    return pre_cadastro(request)

@login_required
def gerar_link_publico_precadastro(request):
    token = gerar_token_acesso_unico()
    link = request.build_absolute_uri(f"/pre-cadastro/link/{token}/")

    qr = qrcode.make(link)
    buffer = BytesIO()
    qr.save(buffer, format='PNG')
    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

    
    
    pacientes = Paciente.objects.filter(pre_cadastro=True)
    print(pacientes)
    
    return render(request, 'core/pacientes/link_gerado.html', {
        'link_tokenizado':link,
        'qrcode_base64':img_base64,
        'pacientes':pacientes
    })


FINALIZADOS = ['desistencia','desistencia_remarcacao','falta_remarcacao','falta_cobrada']
PENDENTES = ['pre','agendado']
def redirect_perfil_paciente(request, paciente_id):
    paciente = get_object_or_404(Paciente, id=paciente_id)
    return redirect("perfil_paciente", paciente_id=paciente.id, slug=paciente.slug)

def perfil_paciente(request,paciente_id, slug):
    inicio_semana, fim_semana = get_semana_atual()

    paciente = get_object_or_404(Paciente, id=paciente_id)
    if paciente.slug != slug:
        return redirect("paciente_detail", id=paciente.id, slug=paciente.slug)
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
    
    
    historico_status = FrequenciaMensal.objects.filter(paciente__id=paciente_id)
    for h in historico_status:
        print(h)
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


    # PRONTUARIO / EVOLUCAO / AVALIACAO

    prontuarios = Prontuario.objects.filter(paciente__id=paciente_id, foi_preenchido=True).order_by('-data_criacao')[:3]
    evolucoes = Evolucao.objects.filter(paciente__id=paciente_id, foi_preenchido=True).order_by('-data_criacao')[:3]
    avaliacoes = AvaliacaoFisioterapeutica.objects.filter(paciente__id=paciente_id, foi_preenchido=True).order_by('-data_avaliacao')[:3]


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
     

     
 
    tres_ultimos_agendamentos = Agendamento.objects.filter(paciente__id=paciente_id).order_by('-data')[:3]
        
    respostas_formularios = RespostaFormulario.objects.filter(
        paciente_id=paciente_id
    ).select_related('formulario').order_by('-enviado_em')
    
    vinculos_como_dependente = VinculoFamiliar.objects.filter(paciente=paciente)
    vinculos_como_responsavel = VinculoFamiliar.objects.filter(familiar=paciente)
    idade = calcular_idade(paciente.data_nascimento)
    eh_menor = idade < 18
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
                'respostas_formularios':respostas_formularios,
                'historico_status':historico_status,
                'vinculos_dependente':vinculos_como_dependente,
                'vinculos_responsavel':vinculos_como_responsavel,
                'eh_menor':eh_menor,
                'prontuarios': prontuarios,
                'evolucoes': evolucoes,
                'avaliacoes': avaliacoes,
                }
    return render(request, 'core/pacientes/perfil_paciente.html', context)


def visualizar_respostas_formulario(request, resposta_id):
    resposta = get_object_or_404(RespostaFormulario, id=resposta_id)
    respostas_perguntas = RespostaPergunta.objects.filter(resposta=resposta).select_related('pergunta')
    
    respostas_preparadas = []
    for rp in respostas_perguntas:
        print(rp.valor)
        respostas_preparadas.append({
            'pergunta': rp.pergunta,
            'valor': rp.valor,  # Mantém o valor original
            'tipo': rp.pergunta.tipo
        })
    
    context = {
        'formulario': resposta.formulario,
        'respostas_preparadas': respostas_preparadas,
        'paciente': resposta.paciente,
        'data_resposta': resposta.enviado_em,
    }
    
    return render(request, 'core/pacientes/respostas_formulario.html', context)

def politica_privacidade(request):
    return render(request, 'core/juridico/politica_privacidade.html')

def paciente_status(request):
    pacientes = Paciente.objects.all()

    context = {
        'pacientes':pacientes,
         
    }
    return render(request, 'core/pacientes/status-mensal/status_mensal.html', context)
 
def lista_status(request, paciente_id):
    paciente = get_object_or_404(Paciente, id=paciente_id)
    historicos = HistoricoStatus.objects.filter(paciente=paciente).order_by('-ano', '-mes')

    data = [{
        'mes': historico.mes,
        'ano': historico.ano,
        'status': historico.status,
        'freq_sistema': historico.freq_sistema,
        'freq_programada': historico.freq_programada,
        'ganhou_beneficio': historico.ganhou_beneficio,
    } for historico in historicos]

    return JsonResponse(data, safe=False)


def lista_notas_fiscais_paciente(request, paciente_id):
    
    paciente = get_object_or_404(Paciente, id=paciente_id)
    listar_notas_fiscais = NotaFiscalEmitida.objects.select_related('pendencia','pendencia__paciente').filter(pendencia__paciente_id=paciente_id).order_by('-data_emissao')
    anos_disponiveis = (listar_notas_fiscais.annotate(ano=ExtractYear('data_emissao')).values_list('ano', flat=True).distinct().order_by('-ano'))
    
    notas_fiscais_count = listar_notas_fiscais.count()
    servicos = Servico.objects.filter(ativo=True)
    print(listar_notas_fiscais)
    context= {
        'paciente':paciente,
        'listar_notas_fiscais':listar_notas_fiscais,
        'notas_fiscais_count':notas_fiscais_count,
        'servicos':servicos,
        'anos_disponiveis':anos_disponiveis,
    }
    
    return render(request, 'core/pacientes/notas_fiscais/lista_notas_fiscais_paciente.html', context)



def visualizar_prontuarios_paciente(request, paciente_id):
    paciente = get_object_or_404(Paciente, id=paciente_id)
    query = request.GET.get('q', '').strip()
    situacao = request.GET.get('situacao', '').strip()
    data_inicio = request.GET.get('data_inicio')
    data_fim = request.GET.get('data_fim')

     
    prontuarios = (
        Prontuario.objects
        .filter(paciente_id=paciente_id)
        .select_related('profissional', 'paciente')
        .order_by('-data_criacao')
    )

    # Filtro por nome ou CPF
    if query:
        prontuarios = prontuarios.filter(
            Q(profissional__nome__icontains=query) | 
            Q(profissional__sobrenome__icontains=query)
        )

    # Filtro por período de datas
    if data_inicio:
        prontuarios = prontuarios.filter(data_criacao__date__gte=data_inicio)
    if data_fim:
        prontuarios = prontuarios.filter(data_criacao__date__lte=data_fim)


    paginator = Paginator(prontuarios, 13)
    page_number = request.GET.get('page')
    
    try:
        page_obj = paginator.get_page(page_number)
    except PageNotAnInteger :
        page_obj = paginator.get_page(1)
    except EmptyPage:
        page_obj = paginator.get_page(paginator.num_pages)
    context = {
        'paciente': paciente,
        'prontuarios': prontuarios,
        'page_obj': page_obj,
    }
    return render(request, 'core/pacientes/historico/visualizar_prontuario.html', context)

def visualizar_evolucoes_paciente(request, paciente_id):
    paciente = get_object_or_404(Paciente, id=paciente_id)
    query = request.GET.get('q', '').strip()
    situacao = request.GET.get('situacao', '').strip()
    data_inicio = request.GET.get('data_inicio')
    data_fim = request.GET.get('data_fim')

    evolucoes = (
        Evolucao.objects
        .filter(paciente_id=paciente_id)
        .select_related('profissional', 'paciente')
        .order_by('-data_criacao')
    )
        # Filtro por nome ou CPF
    if query:
        evolucoes = evolucoes.filter(
            Q(profissional__nome__icontains=query) | 
            Q(profissional__sobrenome__icontains=query)
        )

    # Filtro por período de datas
    if data_inicio:
        evolucoes = evolucoes.filter(data_criacao__date__gte=data_inicio)
    if data_fim:
        evolucoes = evolucoes.filter(data_criacao__date__lte=data_fim)

    paginator = Paginator(evolucoes, 13)
    page_number = request.GET.get('page')
    
    try:
        page_obj = paginator.get_page(page_number)
    except PageNotAnInteger :
        page_obj = paginator.get_page(1)
    except EmptyPage:
        page_obj = paginator.get_page(paginator.num_pages)

    context = {
        'paciente': paciente,
        'evolucoes': evolucoes,
        'page_obj': page_obj,
    }
    return render(request, 'core/pacientes/historico/visualizar_evolucao.html', context)


def visualizar_avaliacoes_paciente(request, paciente_id):
    paciente = get_object_or_404(Paciente, id=paciente_id)
    query = request.GET.get('q', '').strip()
    situacao = request.GET.get('situacao', '').strip()
    data_inicio = request.GET.get('data_inicio')
    data_fim = request.GET.get('data_fim')

    avaliacoes = (
        AvaliacaoFisioterapeutica.objects
        .filter(paciente_id=paciente_id)
        .select_related('profissional', 'paciente')
        .order_by('-data_avaliacao')
    )
    
    if query:
        avaliacoes = avaliacoes.filter(
            Q(profissional__nome__icontains=query) | 
            Q(profissional__sobrenome__icontains=query)
        )

    # Filtro por período de datas
    if data_inicio:
        avaliacoes = avaliacoes.filter(data_criacao__date__gte=data_inicio)
    if data_fim:
        avaliacoes = avaliacoes.filter(data_criacao__date__lte=data_fim)


    paginator = Paginator(avaliacoes, 13)
    page_number = request.GET.get('page')
    

    try:
        page_obj = paginator.get_page(page_number)
    except PageNotAnInteger :
        page_obj = paginator.get_page(1)
    except EmptyPage:
        page_obj = paginator.get_page(paginator.num_pages)

    context = {
        'paciente': paciente,
        'avaliacoes': avaliacoes,
        'page_obj': page_obj,
    }
    return render(request, 'core/pacientes/historico/visualizar_avaliacao.html', context)


def visualizar_agendamentos_paciente(request, paciente_id):
    paciente = get_object_or_404(Paciente, id=paciente_id)
    
    query = request.GET.get('q', '').strip()
    situacao = request.GET.get('situacao', '').strip()
    data_inicio = request.GET.get('data_inicio')
    data_fim = request.GET.get('data_fim')

    agendamentos = (
        Agendamento.objects
        .filter(paciente_id=paciente_id)
        .select_related('profissional_1', 'paciente')
        .order_by('-data')
    )
    
    if query:
        agendamentos = agendamentos.filter(
            Q(profissional__nome__icontains=query) | 
            Q(profissional__sobrenome__icontains=query)
        )

    # Filtro por período de datas
    if data_inicio:
        agendamentos = agendamentos.filter(data_criacao__date__gte=data_inicio)
    if data_fim:
        agendamentos = agendamentos.filter(data_criacao__date__lte=data_fim)


    paginator = Paginator(agendamentos, 13)
    page_number = request.GET.get('page')
    

    try:
        page_obj = paginator.get_page(page_number)
    except PageNotAnInteger :
        page_obj = paginator.get_page(1)
    except EmptyPage:
        page_obj = paginator.get_page(paginator.num_pages)

    
    context = {
        'paciente': paciente,
        'agendamentos': agendamentos,
        'page_obj': page_obj,
    }
    return render(request, 'core/pacientes/historico/visualizar_agendamentos.html', context)