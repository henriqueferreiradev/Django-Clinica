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
import json
from core.models import DocumentoClinica, NotaFiscalCancelada, NotaFiscalEmitida, NotaFiscalPendente, TipoDocumentoEmpresa

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