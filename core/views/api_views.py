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
        
        existe_evolucao = Evolucao.objects.filter(
            agendamento_id=agendamento_id,
            foi_preenchido=True
        ).exists()
        '''
        existe_imagem = Imagem.objects.filter(
            agendamento_id=agendamento_id,
            foi_preenchido=True
        ).exists()
        '''
        existe_avaliacao = AvaliacaoFisioterapeutica.objects.filter(
            agendamento_id=agendamento_id,
            foi_preenchido=True
        ).exists()

        return JsonResponse({'tem_prontuario': existe_prontuario,
                            'tem_evolucao':existe_evolucao,
                            'tem_avaliacao': existe_avaliacao})

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
    try:
        prontuarios = Prontuario.objects.filter(
            paciente_id=paciente_id
        ).select_related('profissional').order_by('-data_criacao')
        
        prontuarios_data = []
        for prontuario in prontuarios:
            prontuarios_data.append({
                'id': prontuario.id,
                'data': prontuario.data_criacao.strftime('%d/%m/%Y'),
                'data_completa': prontuario.data_criacao.strftime('%d/%m/%Y - %H:%M'),
                'agendamento_atual': prontuario.agendamento.data.strftime('%d/%m/%Y - %H:%M'),
                'profissional_nome': prontuario.profissional.nome if prontuario.profissional else 'Não informado',
                'profissional_id': prontuario.profissional.id if prontuario.profissional else None,
                'queixa_principal': prontuario.queixa_principal or '',
                'queixa_preview': (prontuario.queixa_principal[:100] + '...') if prontuario.queixa_principal and len(prontuario.queixa_principal) > 100 else (prontuario.queixa_principal or ''),
                'feedback_paciente': prontuario.feedback_paciente  or '',
                'evolucao': prontuario.evolucao or '',
                'conduta': prontuario.conduta or '',
                'diagnostico': prontuario.diagnostico or '',
                'observacoes': prontuario.observacoes or '',
            })
        
        return JsonResponse({
            'success': True,
            'prontuarios': prontuarios_data,
            'total': len(prontuarios_data)
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e),
            'prontuarios': []
        }, status=500)


def salvar_evolucao(request):

    try:
 
        if request.content_type == 'application/json':
            data = json.loads(request.body)
        else:
            return JsonResponse({'success': False, 'error': 'Content-Type must be application/json'}, status=400)

        required_fields = ['paciente_id', 'profissional_id']
        for field in required_fields:
            if field not in data:
                return JsonResponse({'success': False, 'error': f'Campo obrigatório faltando: {field}'}, status=400)

        evolucao = Evolucao.objects.create(
            paciente_id=data['paciente_id'],
            profissional_id=data['profissional_id'],
            agendamento_id=data.get('agendamento_id'),
            queixa_principal_inicial=data.get('queixa_principal'),
            processo_terapeutico=data.get('processo_terapeutico'),
            condutas_tecnicas=data.get('condutas_tecnicas'),
            resposta_paciente=data.get('resposta_paciente'),
            intercorrencias=data.get('intercorrencias'),
            dor_inicio=data.get('dor_inicio'),
            dor_atual=data.get('dor_atual'),
            dor_observacoes=data.get('dor_observacoes'),
            amplitude_inicio=data.get('amplitude_inicio'),
            amplitude_atual=data.get('amplitude_atual'),
            amplitude_observacoes=data.get('amplitude_observacoes'),
            forca_inicio=data.get('forca_inicio'),
            forca_atual=data.get('forca_atual'),
            forca_observacoes=data.get('forca_observacoes'),
            postura_inicio=data.get('postura_inicio'),
            postura_atual=data.get('postura_atual'),
            postura_observacoes=data.get('postura_observacoes'),
            edema_inicio=data.get('edema_inicio'),
            edema_atual=data.get('edema_atual'),
            edema_observacoes=data.get('edema_observacoes'),
            avds_inicio=data.get('advs_inicio'),
            avds_atual=data.get('advs_atual'),
            avds_observacoes=data.get('advs_observacoes'),
            emocionais_inicio=data.get('asp_emocionais_inicio'),
            emocionais_atual=data.get('asp_emocionais_atual'),
            emocionais_observacoes=data.get('asp_emocionais_observacoes'),
            sintese_evolucao=data.get('sintese_evolucao'),
            mensagem_paciente=data.get('mensagem_paciente'),
            explicacao_continuidade=data.get('explicacao_continuidade'),
            reacoes_paciente=data.get('reacoes_paciente'),
            dor_expectativa=data.get('dor_expectativa'),
            dor_realidade=data.get('dor_realidade'),
            energia_expectativa=data.get('energia_expectativa'),
            energia_realidade=data.get('energia_realidade'),
            consciencia_expectativa=data.get('consciencia_expectativa'),
            consciencia_realidade=data.get('consciencia_realidade'),
            emocao_expectativa=data.get('emocao_expectativa'),
            emocao_realidade=data.get('emocao_realidade'),
            objetivos_ciclo=data.get('objetivos_ciclo'),
            condutas_mantidas=data.get('condutas_mantidas'),
            ajustes_plano=data.get('ajustes_plano'),
            treino_funcional=data.get('treino_funcional'),
            pilates_clinico=data.get('pilates_clinico'),
            recovery=data.get('recovery'),
            rpg=data.get('rpg'),
            nutricao=data.get('nutricao'),
            estetica=data.get('estetica'),
            outro_complementar=data.get('outro_complementar'),
            outro_complementar_texto=data.get('outro_complementar_texto'),
            observacoes_internas=data.get('observacoes_internas'),
            orientacoes_grupo=data.get('orientacoes_grupo'),
            foi_preenchido=True,
            

        )
        evolucoes = Evolucao.objects.all()
        for p in evolucoes:
            print(p.foi_preenchido)
 
        return JsonResponse({
            'success': True,
            'message': 'Evolução salva com sucesso!',
            'evolucao_id': evolucao.id,
            'data_criacao': evolucao.data_criacao.isoformat()
        })

    except Exception as e:
        import traceback
        traceback.print_exc()   # mostra o erro completo no terminal
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

    
def listar_evolucoes(request, paciente_id):
    ...
    
def salvar_avaliacao(request):
    try:
    
            if request.content_type == 'application/json':
                data = json.loads(request.body)
            else:
                return JsonResponse({'success': False, 'error': 'Content-Type must be application/json'}, status=400)

            required_fields = ['paciente_id', 'profissional_id']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({'success': False, 'error': f'Campo obrigatório faltando: {field}'}, status=400)

            avaliacao = AvaliacaoFisioterapeutica.objects.create(
                paciente_id=data['paciente_id'],
                profissional_id=data['profissional_id'],
                agendamento_id=data.get('agendamento_id'),
                usuario_logado=request.user,
                queixa_principal=data.get('queixa_principal'),
                inicio_problema=data.get('inicio_problema'),
                causa_problema=data.get('causa_problema'),
                dor_recente_antiga=data.get('dor_recente_antiga'),
                episodios_anteriores=data.get('episodios_anteriores'),
                tratamento_anterior=data.get('tratamento_anterior'),
                qual_tratamento=data.get('qual_tratamento'),
                cirurgia_procedimento=data.get('cirurgia_procedimento'),
                acompanhamento_medico=data.get('acompanhamento_medico'),
                medico_especialidade=data.get('medico_especialidade'),
                diagnostico_medico=data.get('diagnostico_medico'),
                uso_medicamentos=data.get('uso_medicamentos'),
                exames_trazidos=data.get('exames_trazidos'),
                tipo_exame=data.get('tipo_exame'),
                historico_lesoes=data.get('historico_lesoes'),
                doencas_previas=data.get('doencas_previas'),
                cirurgias_previas=data.get('cirurgias_previas'),
                historico_familiar=data.get('historico_familiar'),
                qualidade_sono=data.get('qualidade_sono'),
                horas_sono=data.get('horas_sono'),
                alimentacao=data.get('alimentacao'),
                nivel_atividade=data.get('nivel_atividade'),
                tipo_exercicio=data.get('tipo_exercicio'),
                nivel_estresse=data.get('nivel_estresse'),
                rotina_trabalho=data.get('rotina_trabalho'),
                aspectos_emocionais=data.get('aspectos_emocionais'),
                localizacao_dor=data.get('localizacao_dor'),
                tipo_dor_pontada=data.get('tipo_dor_pontada'),
                tipo_dor_queimacao=data.get('tipo_dor_queimacao'),
                tipo_dor_peso=data.get('tipo_dor_peso'),
                tipo_dor_choque=data.get('tipo_dor_choque'),
                tipo_dor_outra=data.get('tipo_dor_outra'),
                tipo_dor_outra_texto=data.get('tipo_dor_outra_texto'),
                intensidade_repouso=data.get('intensidade_repouso'),
                intensidade_movimento=data.get('intensidade_movimento'),
                intensidade_pior=data.get('intensidade_pior'),
                fatores_agravam=data.get('fatores_agravam'),
                fatores_aliviam=data.get('fatores_aliviam'),
                sinal_edema=data.get('sinal_edema'),
                sinal_parestesia=data.get('sinal_parestesia'),
                sinal_rigidez=data.get('sinal_rigidez'),
                sinal_fraqueza=data.get('sinal_fraqueza'),
                sinal_compensacoes=data.get('sinal_compensacoes'),
                sinal_outro=data.get('sinal_outro'),
                sinal_outro_texto=data.get('sinal_outro_texto'),
                grau_inflamacao=data.get('grau_inflamacao'),
                inspecao_postura=data.get('inspecao_postura'),
                compensacoes_corporais=data.get('compensacoes_corporais'),
                padrao_respiratorio=data.get('padrao_respiratorio'),
                palpacao=data.get('palpacao'),
                pontos_dor=data.get('pontos_dor'),
                testes_funcionais=data.get('testes_funcionais'),
                outras_observacoes=data.get('outras_observacoes'),
                diagnostico_completo=data.get('diagnostico_completo'),
                grau_dor=data.get('grau_dor'),
                limitacao_funcional=data.get('limitacao_funcional'),
                grau_inflamacao_num=data.get('grau_inflamacao_num'),
                grau_edema=data.get('grau_edema'),
                receptividade=data.get('receptividade'),
                autonomia_avd=data.get('autonomia_avd'),
                objetivo_geral=data.get('objetivo_geral'),
                objetivo_principal=data.get('objetivo_principal'),
                objetivo_secundario=data.get('objetivo_secundario'),
                pontos_atencao=data.get('pontos_atencao'),
                tecnica_liberacao=data.get('tecnica_liberacao'),
                tecnica_mobilizacao=data.get('tecnica_mobilizacao'),
                tecnica_dry_needling=data.get('tecnica_dry_needling'),
                tecnica_ventosa=data.get('tecnica_ventosa'),
                tecnica_manipulacoes=data.get('tecnica_manipulacoes'),
                tecnica_outras=data.get('tecnica_outras'),
                tecnica_outras_texto=data.get('tecnica_outras_texto'),
                recurso_aussie=data.get('recurso_aussie'),
                recurso_russa=data.get('recurso_russa'),
                recurso_aussie_tens=data.get('recurso_aussie_tens'),
                recurso_us=data.get('recurso_us'),
                recurso_termo=data.get('recurso_termo'),
                recurso_outro=data.get('recurso_outro'),
                recurso_outro_texto=data.get('recurso_outro_texto'),
                cinesio_fortalecimento=data.get('cinesio_fortalecimento'),
                cinesio_alongamento=data.get('cinesio_alongamento'),
                cinesio_postural=data.get('cinesio_postural'),
                cinesio_respiracao=data.get('cinesio_respiracao'),
                cinesio_mobilidade=data.get('cinesio_mobilidade'),
                cinesio_funcional=data.get('cinesio_funcional'),
                descricao_plano=data.get('descricao_plano'),
                medo_agulha=data.get('medo_agulha'),
                limiar_dor_baixo=data.get('limiar_dor_baixo'),
                fragilidade=data.get('fragilidade'),
                frequencia=data.get('frequencia'),
                duracao=data.get('duracao'),
                reavaliacao_sessao=data.get('reavaliacao_sessao'),
                evolucao_primeira_sessao=data.get('evolucao_primeira_sessao'),
                evolucao_proximas_sessoes=data.get('evolucao_proximas_sessoes'),
                expectativas_primeira_etapa=data.get('expectativas_primeira_etapa'),
                proximos_passos=data.get('proximos_passos'),
                sobre_orientacoes=data.get('sobre_orientacoes'),
                sono_rotina=data.get('sono_rotina'),
                postura_ergonomia=data.get('postura_ergonomia'),
                alimentacao_hidratacao=data.get('alimentacao_hidratacao'),
                exercicios_casa=data.get('exercicios_casa'),
                aspectos_emocionais_espirituais=data.get('aspectos_emocionais_espirituais'),
                observacoes_finais=data.get('observacoes_finais'),
                foi_preenchido=True,
                

            )
            avaliacoes = AvaliacaoFisioterapeutica.objects.all()
            for p in avaliacoes:
                
                print(p.foi_preenchido)
    
            return JsonResponse({
                'success': True,
                'message': 'Avaliação salva com sucesso!',
                'evolucao_id': avaliacao.id,
                'data_criacao': avaliacao.data_avaliacao.isoformat()
            })

    except Exception as e:
        import traceback
        traceback.print_exc()   # mostra o erro completo no terminal
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
def listar_avaliacoes(request, paciente_id):
    ...
    
def salvar_imagem(request):
    ...
    
def listar_imagens(request, paciente_id):
    ...
    
def criar_pasta_imagem(request, paciente_id):
    ...
    