from datetime import datetime
from multiprocessing import context
import stat
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import login,logout
from django.contrib import contenttypes, messages
from django.shortcuts import get_object_or_404, render, redirect
from django.db.models import Sum
from django.http import JsonResponse
from django.core.exceptions import ObjectDoesNotExist
import json
from core.models import NotaFiscalEmitida, NotaFiscalPendente

def dashboard(request):
 
    return render(request, 'core/administrativo/dashboard_adm.html', {
  
    })

def notas_fiscais_views(request):
    nf_pendente_count = NotaFiscalPendente.objects.filter(status='pendente').count()
    nf_pendente_lista = NotaFiscalPendente.objects.select_related('paciente')
    nf_pendente_soma  = NotaFiscalPendente.objects.filter(status='pendente').aggregate(total=Sum('valor'))['total'] or 0

    
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
                'observacao': nota.observacao,
                'usuario': nota.usuario.username if nota.usuario else None
            }
        })
    except NotaFiscalPendente.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Pendência não encontrada'}, status=404)