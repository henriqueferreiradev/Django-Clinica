from django.http import Http404, JsonResponse
from django.shortcuts import get_object_or_404
from django.template.context_processors import request
from core.models import AvaliacaoFisioterapeutica, Evolucao, Paciente, Pagamento, PacotePaciente, Agendamento,Prontuario

from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from core.models import Paciente, Pagamento

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from core.models import Pagamento
# core/views/api_views.py
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from django.utils.dateparse import parse_date
from core.services.financeiro import registrar_pagamento
from core.models import Pagamento
from django.http import JsonResponse
import json

def verificar_cpf(request):
    cpf = request.GET.get('cpf', None)
    exclude_id = request.GET.get('exclude', None)
    existe = False
    
    if cpf:
        queryset = Paciente.objects.filter(cpf=cpf)
        if exclude_id:
            queryset = queryset.exclude(id=exclude_id)
        existe = queryset.exists()
    
    return JsonResponse({'existe': existe})

def verificar_prontuario(request, agendamento_id):
    try:
        # Verifica se existe um prontuário preenchido vinculado a esse agendamento
        existe_prontuario = Prontuario.objects.filter(
            agendamento_id=agendamento_id,
            foi_preenchido=True
        ).exists()
        '''
        existe_evolucao = Evolucao.objects.filter(
            agendamento_id=agendamento_id,
            foi_preenchido=True
        ).exists()
       
        existe_imagem = Imagem.objects.filter(
            agendamento_id=agendamento_id,
            foi_preenchido=True
        ).exists()
       
        existe_avaliacao = AvaliacaoFisioterapeutica.objects.filter(
            agendamento_id=agendamento_id,
            foi_preenchido=True
        ).exists()
 '''
        return JsonResponse({'tem_prontuario': existe_prontuario})

    except Exception as e:
        print("Erro ao verificar prontuário:", e)
        raise Http404
    
    
@login_required
@require_POST
def registrar_recebimento(request, pagamento_id):
    try:
        data = json.loads(request.body)
        pagamento = Pagamento.objects.get(pk=pagamento_id)

        data_recebimento = parse_date(data.get('data_recebimento'))
        forma_pagamento = data.get('forma_pagamento')
        valor_recebido = float(data.get('valor_recebido', 0))
        gerar_recibo = data.get('gerar_recibo', False)

        # Atualiza o pagamento original
        pagamento.data_recebimento = data_recebimento
        pagamento.forma_pagamento = forma_pagamento
        pagamento.valor_recebido = valor_recebido
        pagamento.status = 'pago'
        pagamento.save()

        # Cria movimento financeiro / registro no caixa
        registrar_pagamento(
            receita=pagamento,
            paciente=pagamento.paciente,
            pacote=pagamento.pacote,
            agendamento=pagamento.agendamento,
            valor=valor_recebido,
            forma_pagamento=forma_pagamento
        )

        # Registro de log
        from core.utils import registrar_log
        registrar_log(
            usuario=request.user,
            acao='Recebimento',
            modelo='Pagamento',
            objeto_id=pagamento.id,
            descricao=f"Recebimento de R${valor_recebido:.2f} registrado para {pagamento.paciente.nome}."
        )

        return JsonResponse({
            'ok': True,
            'mensagem': f'Pagamento de R$ {valor_recebido:.2f} confirmado.',
            'data_recebimento': data_recebimento
        })
    except Pagamento.DoesNotExist:
        return JsonResponse({'ok': False, 'erro': 'Pagamento não encontrado.'}, status=404)
    except Exception as e:
        return JsonResponse({'ok': False, 'erro': str(e)}, status=500)

def salvar_prontuario(request):
    try:
 

        if request.content_type == 'application/json':
            data = json.loads(request.body)
        else:
            return JsonResponse({'success': False, 'error': 'Content-Type must be application/json'}, status=400)

        required_fields = ['paciente_id', 'profissional_id']
        for field in required_fields:
            if field not in data:
                return JsonResponse({'success': False, 'error': f'Campo obrigatório faltando: {field}'}, status=400)

        prontuario = Prontuario.objects.create(
            paciente_id=data['paciente_id'],
            profissional_id=data['profissional_id'],
            agendamento_id=data.get('agendamento_id'),
            queixa_principal=data['queixa_principal'],
            feedback_paciente=data.get('historia_doenca', ''),
            evolucao=data.get('exame_fisico', ''),
            conduta=data.get('conduta', ''),
            diagnostico=data.get('diagnostico', ''),
            observacoes=data.get('observacoes', ''),
            foi_preenchido=True,
        )
        prontuarios = Prontuario.objects.all()
        for p in prontuarios:
            print(p.foi_preenchido)
 
        return JsonResponse({
            'success': True,
            'message': 'Prontuário salvo com sucesso!',
            'prontuario_id': prontuario.id,
            'data_criacao': prontuario.data_criacao.isoformat()
        })

    except Exception as e:
        import traceback
        
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

def listar_prontuarios(request, paciente_id):
    ...
    
def salvar_evolucao(request):
    ...
    
def listar_evolucoes(request, paciente_id):
    ...
    
def salvar_avaliacao(request):
    ...
    
def listar_avaliacoes(request, paciente_id):
    ...
    
def salvar_imagem(request):
    ...
    
def listar_imagens(request, paciente_id):
    ...
    
def criar_pasta_imagem(request, paciente_id):
    ...
    