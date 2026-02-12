from datetime import datetime, timedelta 
from multiprocessing import context
import stat
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import login,logout
from django.contrib import contenttypes, messages
from django.shortcuts import get_object_or_404, render, redirect
from django.db.models import Sum
from django.http import JsonResponse
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone
from django.template.context_processors import request
from django.contrib.auth.models import User
import json
from core.models import Agendamento, AvaliacaoFisioterapeutica, ConfigAgenda, DocumentoClinica, EscalaBaseProfissional, Evolucao, NotaFiscalCancelada, NotaFiscalEmitida, NotaFiscalPendente, ProdutividadeDia, ProdutividadeMensal, Profissional, Prontuario, TipoDocumentoEmpresa

def dashboard(request):
 
    return render(request, 'core/administrativo/dashboard_adm.html', {
  
    })

def notas_fiscais_views(request):

    
    hoje = timezone.now().date()
    notas_para_atualizar = NotaFiscalPendente.objects.filter(status__in=['pendente','atrasado'], previsao_emissao__isnull=False)

    for nota in notas_para_atualizar:
        status_antigo = nota.status
        nota.atualizar_status()
        if nota.status != status_antigo:
            nota.save(update_fields=['status'])


    paciente_param = request.GET.get('paciente')
    prazo_filter = request.GET.get('prazo')
    status = request.GET.get('status')
    finalidade_filter = request.GET.get('finalidade')
    
    nf_pendente_lista = NotaFiscalPendente.objects.select_related('paciente')

    if paciente_param:
        if paciente_param.isdigit():
            nf_pendente_lista = nf_pendente_lista.filter(paciente_id=int(paciente_param))
        else:
            nf_pendente_lista = nf_pendente_lista.filter(paciente__nome__icontains=paciente_param)

    if prazo_filter:
        data = datetime.strptime(prazo_filter, '%Y-%m-%d').date()
        nf_pendente_lista = nf_pendente_lista.filter(previsao_emissao=data)

    if status:
        nf_pendente_lista =  nf_pendente_lista.filter(status=status)
    
    if finalidade_filter == 'nf_reembolso_plano':
        nf_pendente_lista =  nf_pendente_lista.filter(paciente__nf_reembolso_plano=True)

    if finalidade_filter == 'nf_imposto_renda':
        nf_pendente_lista =  nf_pendente_lista.filter(paciente__nf_imposto_renda=True)


    

   
    nf_pendente_count = nf_pendente_lista.filter(status='pendente').count()
    nf_pendente_count_hoje = nf_pendente_lista.filter(criado_em=hoje,status='pendente').count()
    nf_pendente_soma = nf_pendente_lista.filter(status__in=['pendente', 'atrasado']).aggregate(total=Sum('valor'))['total'] or 0
    nf_atrasado_count = NotaFiscalPendente.objects.filter(status='atrasado').count()
    nf_emitidas_hoje_count = NotaFiscalEmitida.objects.filter(data_emissao=hoje).count()
 










    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        tipo = request.POST.get('tipo')
        
        if tipo == 'editar_nota':
            nota_fiscal_id = request.POST.get('nota_id')
            previsao_emissao = request.POST.get('previsao_emissao')
            print(nota_fiscal_id, previsao_emissao)
            try:
                nota_fiscal = NotaFiscalPendente.objects.get(id=nota_fiscal_id)
                previsao_emissao_str = request.POST.get('previsao_emissao')
                nota_fiscal.previsao_emissao = datetime.strptime(
                previsao_emissao_str, '%Y-%m-%d'
                ).date()
                nota_fiscal.save()
                
                return JsonResponse({'success': True})
            except Exception as e:
                return JsonResponse({'success': False, 'error': str(e)})

    print(nf_pendente_lista)
    for nota in nf_pendente_lista:
        print()
        
        
    context = {
        'nf_pendente_count':nf_pendente_count,
        'nf_pendente_lista':nf_pendente_lista,
        'nf_pendente_soma':nf_pendente_soma,
        'nf_emitidas_hoje_count':nf_emitidas_hoje_count,
        'nf_atrasado_count':nf_atrasado_count,
        'nf_pendente_count_hoje':nf_pendente_count_hoje
        }

    return render(request, 'core/administrativo/notas_fiscais.html', context)

 

def salvar_notafiscal(request):
    try:
        if request.method == 'POST' and request.content_type == 'application/json':
            data = json.loads(request.body)
            print(data)
            nota_pendente = get_object_or_404(NotaFiscalPendente, id=int(data['pendencia']))
            
            
            NotaFiscalEmitida.objects.create(
                pendencia = nota_pendente,
                numero = data['numero'],
                link = data['link'],
                data_emissao = data['data_emissao'],
                observacao = data['observacao'],
            )
            
                        
            nota_pendente.status = 'emitida'
            nota_pendente.emitida_em = data['data_emissao']
            nota_pendente.save(update_fields=['status', 'emitida_em'])
             
            return JsonResponse({'success': True})
        else:
            return JsonResponse(
                {'success': False, 'error': 'Content-Type inválido'},
                status=400
            )

    except Exception as e:
        print('ERRO:', e)
        return JsonResponse(
            {'success': False, 'error': str(e)},
            status=500
        )
        
def cancelar_notafiscal(request):
    try:
        if request.method == 'POST' and request.content_type == 'application/json':
            data = json.loads(request.body)
            print(data)
            nota_pendente = get_object_or_404(NotaFiscalPendente, id=int(data['pendencia']))
            
            
            NotaFiscalCancelada.objects.create(
                pendencia = nota_pendente,
                motivo_cancelamento = data['motivo_cancelamento'],
                observacao = data['observacao'],
            )
            
                        
            nota_pendente.status = 'cancelada'
            nota_pendente.save(update_fields=['status'])
             
            return JsonResponse({'success': True})
        else:
            return JsonResponse(
                {'success': False, 'error': 'Content-Type inválido'},
                status=400
            )

    except Exception as e:
        print('ERRO:', e)
        return JsonResponse(
            {'success': False, 'error': str(e)},
            status=500
        )
        

def api_detalhes_notafiscal_por_pendencia(request, pendencia_id):
    try:
        pendencia = NotaFiscalPendente.objects.select_related('nota_emitida').get(id=pendencia_id)

        if not hasattr(pendencia, 'nota_emitida'):
            return JsonResponse({
                'success': False,
                'error': 'Nota ainda não emitida'
            }, status=404)

        nota = pendencia.nota_emitida

        return JsonResponse({
            'success': True,
            'nota': {
                'id': nota.id,
                'pendencia_id': pendencia.id,
                'paciente': f'{pendencia.paciente.nome} {pendencia.paciente.sobrenome}',
                'documento': pendencia.paciente.cpf,
                'numero': nota.numero,
                'link': nota.link,
                'data_emissao': nota.data_emissao,
                'observacao': nota.observacao if nota.observacao else 'Sem observação registrada.',
                 
            }
        })
    except NotaFiscalPendente.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Pendência não encontrada'}, status=404)


def documentos_clinica_views(request):
    hoje = timezone.now().date()
    limite = hoje +timedelta(days=20)
    lista_documentos = TipoDocumentoEmpresa.objects.all()
    todos_documentos = DocumentoClinica.objects.all() 
    todos_documentos_count = DocumentoClinica.objects.all().count()
    todos_documentos_vencidos = DocumentoClinica.objects.filter(validade__isnull=False, validade__lt=hoje).count()
    todos_documentos_proximos = DocumentoClinica.objects.filter(validade__isnull=False, validade__gte=hoje,validade__lte=limite).count()
    todos_sem_validade = DocumentoClinica.objects.filter(validade__isnull=True).count()
    
    context = {
        'lista_documentos':lista_documentos,
        'todos_documentos_vencidos':todos_documentos_vencidos,
        'todos_documentos_proximos':todos_documentos_proximos,
        'todos_documentos':todos_documentos,
        'todos_documentos_count':todos_documentos_count,
        
    }
    return render(request, 'core/administrativo/documentos.html', context)

def salvar_documento_empresa(request):
    try:
        if request.method == 'POST':
            print(DocumentoClinica)

            tipo = TipoDocumentoEmpresa.objects.get(id=request.POST.get('docType'))

            if tipo.exige_validade and not request.POST.get('docExpiry'):
                return JsonResponse(
                    {'success': False, 'error': 'Este tipo de documento exige validade.'},
                    status=400
    )

            
            DocumentoClinica.objects.create(
                tipo_id=request.POST.get('docType'),
                validade=request.POST.get('docExpiry') or None,
                arquivo=request.FILES.get('arquivo'),
                observacao=request.POST.get('docNotes')
            )

            return JsonResponse({'success': True})

        return JsonResponse(
            {'success': False, 'error': 'Método inválido'},
            status=400
        )

    except Exception as e:
        print('ERRO:', e)
        return JsonResponse(
            {'success': False, 'error': str(e)},
            status=500
        )
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
def produtividade_views(request):
    
    return render(request, 'core/administrativo/produtividade.html')

def definir_tipo_dia(profissional, ano, mes, dia):

    data_obj = date(ano, mes, dia)
    dia_semana_num = data_obj.weekday()

    # 🔹 MAPEAR número do weekday para string clínica
    map_semana_clinica = {
        0: 'segunda',
        1: 'terca',
        2: 'quarta',
        3: 'quinta',
        4: 'sexta',
        5: 'sabado',
        6: 'domingo'
    }

    map_semana_escala = {
        0: 'seg',
        1: 'ter',
        2: 'qua',
        3: 'qui',
        4: 'sex',
        5: 'sab',
        6: 'dom'
    }

    # 🔹 1) Verifica se clínica funciona
    config_clinica = ConfigAgenda.objects.first()
    if not config_clinica:
        return None

    dia_str_clinica = map_semana_clinica[dia_semana_num]

    if dia_str_clinica not in config_clinica.dias_funcionamento:
        return None  # clínica fechada

    # 🔹 2) Verifica se profissional trabalha nesse dia
    dia_str_escala = map_semana_escala[dia_semana_num]

    trabalha = EscalaBaseProfissional.objects.filter(
        profissional=profissional,
        dia_semana=dia_str_escala,
        ativo=True
    ).exists()

    if trabalha:
        return 'previsto'
    else:
        return 'nao_previsto'

from django.http import JsonResponse
from calendar import monthrange

from django.shortcuts import get_object_or_404

def carregar_produtividade(request):

    profissional_id = request.GET.get('profissional')
    ano = int(request.GET.get('ano'))
    mes = int(request.GET.get('mes'))

    # 🔹 Agora pega direto o Profissional
    profissional = get_object_or_404(Profissional, id=profissional_id)

    relatorio, _ = ProdutividadeMensal.objects.get_or_create(
        profissional=profissional,
        ano=ano,
        mes=mes
    )


    total_dias = monthrange(ano, mes)[1]

    for dia in range(1, total_dias + 1):

        tipo_dia = definir_tipo_dia(relatorio.profissional, ano, mes, dia)

        if tipo_dia is None:
            continue

        ProdutividadeDia.objects.get_or_create(
            relatorio=relatorio,
            dia=dia,
            defaults={
                'tipo_dia': tipo_dia,
                'presenca': 'presente'
            }
        )

    dias = relatorio.dias.order_by('dia')

    if relatorio.status == 'fechado':
        return JsonResponse(montar_json_snapshot(relatorio, dias))
    else:
        return JsonResponse(montar_json_dinamico(relatorio, dias))

def calcular_dados_automaticos_por_dia(profissional, ano, mes, dia):
    from datetime import date

    data_ref = date(ano, mes, dia)

    ags = Agendamento.objects.filter(
        profissional=profissional,
        data=data_ref
    )

    individual = 0
    conjunto = 0

    for ag in ags:
        duracao = (ag.hora_fim - ag.hora_inicio).seconds // 60
        if ag.tipo == 'individual':
            individual += duracao
        elif ag.tipo == 'conjunto':
            conjunto += duracao

    avaliacoes = AvaliacaoFisioterapeutica.objects.filter(profissional=profissional, data=data_ref).count()
    evolucoes = Evolucao.objects.filter(profissional=profissional, data=data_ref).count()
    prontuarios = Prontuario.objects.filter(profissional=profissional, data=data_ref).count()

    return {
        "individual_min": individual,
        "conjunto_min": conjunto,
        "avaliacoes": avaliacoes,
        "evolucoes": evolucoes,
        "prontuarios": prontuarios
    }
from django.utils import timezone

def fechar_mes(relatorio):

    if relatorio.status == 'fechado':
        return

    total_previstas = 0
    total_trabalhadas = 0
    total_individual = 0
    total_conjunto = 0
    total_prontuario = 0
    total_coord = 0
    total_buro = 0
    total_avaliacoes = 0
    total_evolucoes = 0
    total_prontuarios_qtd = 0

    for dia in relatorio.dias.all():

        auto = calcular_dados_automaticos_por_dia(
            relatorio.profissional,
            relatorio.ano,
            relatorio.mes,
            dia.dia
        )

        total_dia = (
            auto['individual_min'] +
            auto['conjunto_min'] +
            dia.horas_prontuario_min +
            dia.horas_coord_min +
            dia.horas_buro_min
        )

        saldo = total_dia - dia.horas_previstas_min

        dia.individual_min = auto['individual_min']
        dia.conjunto_min = auto['conjunto_min']
        dia.avaliacoes_qtd = auto['avaliacoes']
        dia.evolucoes_qtd = auto['evolucoes']
        dia.prontuarios_qtd = auto['prontuarios']
        dia.total_trabalhado_min = total_dia
        dia.saldo_min = saldo
        dia.save()

        total_previstas += dia.horas_previstas_min
        total_trabalhadas += total_dia
        total_individual += auto['individual_min']
        total_conjunto += auto['conjunto_min']
        total_prontuario += dia.horas_prontuario_min
        total_coord += dia.horas_coord_min
        total_buro += dia.horas_buro_min
        total_avaliacoes += auto['avaliacoes']
        total_evolucoes += auto['evolucoes']
        total_prontuarios_qtd += auto['prontuarios']

    saldo_final = total_trabalhadas - total_previstas

    relatorio.total_previstas_min = total_previstas
    relatorio.total_trabalhadas_min = total_trabalhadas
    relatorio.total_saldo_min = saldo_final
    relatorio.total_individual_min = total_individual
    relatorio.total_conjunto_min = total_conjunto
    relatorio.total_prontuario_min = total_prontuario
    relatorio.total_coord_min = total_coord
    relatorio.total_buro_min = total_buro
    relatorio.total_avaliacoes = total_avaliacoes
    relatorio.total_evolucoes = total_evolucoes
    relatorio.total_prontuarios_qtd = total_prontuarios_qtd

    relatorio.perc_horas_trabalhadas = round((total_trabalhadas / total_previstas) * 100) if total_previstas else 0
    relatorio.perc_saldo = round((saldo_final / total_previstas) * 100) if total_previstas else 0

    horas_prontuario_h = total_prontuario / 60
    relatorio.razao_prontuario = round(total_prontuarios_qtd / horas_prontuario_h, 2) if horas_prontuario_h else 0

    relatorio.status = 'fechado'
    relatorio.fechado_em = timezone.now()
    relatorio.save()



from datetime import date
def montar_json_dinamico(relatorio, dias):

    response_dias = []

    total_previstas = 0
    total_trabalhadas = 0
    total_individual = 0
    total_conjunto = 0
    total_prontuario = 0
    total_coord = 0
    total_buro = 0
    total_avaliacoes = 0
    total_evolucoes = 0
    total_prontuarios_qtd = 0

    for d in dias:

        auto = calcular_dados_automaticos_por_dia(
            relatorio.profissional,
            relatorio.ano,
            relatorio.mes,
            d.dia
        )

        total_dia = (
            auto['individual_min'] +
            auto['conjunto_min'] +
            d.horas_prontuario_min +
            d.horas_coord_min +
            d.horas_buro_min
        )

        saldo = total_dia - d.horas_previstas_min

        response_dias.append({
            "dia": d.dia,
            "tipo_dia": d.tipo_dia,
            "presenca": d.presenca,
            "horas_previstas_min": d.horas_previstas_min,
            "individual_min": auto['individual_min'],
            "conjunto_min": auto['conjunto_min'],
            "avaliacoes": auto['avaliacoes'],
            "evolucoes": auto['evolucoes'],
            "prontuarios": auto['prontuarios'],
            "horas_prontuario_min": d.horas_prontuario_min,
            "horas_coord_min": d.horas_coord_min,
            "horas_buro_min": d.horas_buro_min,
            "total_trabalhado_min": total_dia,
            "saldo_min": saldo,
        })

        total_previstas += d.horas_previstas_min
        total_trabalhadas += total_dia
        total_individual += auto['individual_min']
        total_conjunto += auto['conjunto_min']
        total_prontuario += d.horas_prontuario_min
        total_coord += d.horas_coord_min
        total_buro += d.horas_buro_min
        total_avaliacoes += auto['avaliacoes']
        total_evolucoes += auto['evolucoes']
        total_prontuarios_qtd += auto['prontuarios']

    saldo_final = total_trabalhadas - total_previstas

    perc_horas = round((total_trabalhadas / total_previstas) * 100) if total_previstas else 0
    perc_saldo = round((saldo_final / total_previstas) * 100) if total_previstas else 0

    horas_prontuario_h = total_prontuario / 60
    razao = round(total_prontuarios_qtd / horas_prontuario_h, 2) if horas_prontuario_h else 0

    return {
        "status": relatorio.status,
        "dias": response_dias,
        "totais": {
            "total_previstas_min": total_previstas,
            "total_trabalhadas_min": total_trabalhadas,
            "total_saldo_min": saldo_final,
            "total_individual_min": total_individual,
            "total_conjunto_min": total_conjunto,
            "total_prontuario_min": total_prontuario,
            "total_coord_min": total_coord,
            "total_buro_min": total_buro,
            "total_avaliacoes": total_avaliacoes,
            "total_evolucoes": total_evolucoes,
            "total_prontuarios_qtd": total_prontuarios_qtd,
            "perc_horas": perc_horas,
            "perc_saldo": perc_saldo,
            "razao_prontuario": razao
        }
    }
def montar_json_snapshot(relatorio, dias):

    response_dias = []

    for d in dias:
        response_dias.append({
            "dia": d.dia,
            "tipo_dia": d.tipo_dia,
            "presenca": d.presenca,
            "horas_previstas_min": d.horas_previstas_min,
            "individual_min": d.individual_min,
            "conjunto_min": d.conjunto_min,
            "avaliacoes": d.avaliacoes_qtd,
            "evolucoes": d.evolucoes_qtd,
            "prontuarios": d.prontuarios_qtd,
            "horas_prontuario_min": d.horas_prontuario_min,
            "horas_coord_min": d.horas_coord_min,
            "horas_buro_min": d.horas_buro_min,
            "total_trabalhado_min": d.total_trabalhado_min,
            "saldo_min": d.saldo_min,
        })

    return {
        "status": relatorio.status,
        "dias": response_dias,
        "totais": {
            "total_previstas_min": relatorio.total_previstas_min,
            "total_trabalhadas_min": relatorio.total_trabalhadas_min,
            "total_saldo_min": relatorio.total_saldo_min,
            "total_individual_min": relatorio.total_individual_min,
            "total_conjunto_min": relatorio.total_conjunto_min,
            "total_prontuario_min": relatorio.total_prontuario_min,
            "total_coord_min": relatorio.total_coord_min,
            "total_buro_min": relatorio.total_buro_min,
            "total_avaliacoes": relatorio.total_avaliacoes,
            "total_evolucoes": relatorio.total_evolucoes,
            "total_prontuarios_qtd": relatorio.total_prontuarios_qtd,
            "perc_horas": relatorio.perc_horas_trabalhadas,
            "perc_saldo": relatorio.perc_saldo,
            "razao_prontuario": float(relatorio.razao_prontuario),
        }
    }
