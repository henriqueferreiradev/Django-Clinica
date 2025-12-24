from datetime import date,datetime
from decimal import Decimal

from django.http import Http404, JsonResponse
from django.shortcuts import get_object_or_404
from django.template.context_processors import request
from core.models import Agendamento, AvaliacaoFisioterapeutica, CategoriaContasReceber, CategoriaFinanceira, Evolucao, Paciente, PacotePaciente, Pagamento, Profissional, Prontuario, Receita
from django.utils import timezone
from django.templatetags.static import static
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from core.models import Paciente, Pagamento
from core.utils import registrar_log
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.test import RequestFactory
import json
from core.models import Pagamento
# core/views/api_views.py
from django.views.decorators.http import require_GET, require_POST
from django.contrib.auth.decorators import login_required
from django.utils.dateparse import parse_date
from core.services.financeiro import criar_pagamento
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
        
        prontuario = Prontuario.objects.filter(agendamento_id=agendamento_id).first()
        evolucao = Evolucao.objects.filter(agendamento_id=agendamento_id).first()
        avaliacao = AvaliacaoFisioterapeutica.objects.filter(agendamento_id=agendamento_id).first()
        
        existe_prontuario = prontuario is not None
        prontuario_nao_se_aplica = prontuario.nao_se_aplica if prontuario else False
        
        existe_evolucao = evolucao is not None
        evolucao_nao_se_aplica = evolucao.nao_se_aplica if evolucao else False

        existe_avaliacao = avaliacao is not None
        avaliacao_nao_se_aplica = avaliacao.nao_se_aplica if avaliacao else False

        return JsonResponse({
            'tem_prontuario': existe_prontuario,
            'prontuario_nao_se_aplica': prontuario_nao_se_aplica,
            'tem_evolucao': existe_evolucao,
            'evolucao_nao_se_aplica': evolucao_nao_se_aplica,
            'tem_avaliacao': existe_avaliacao,
            'avaliacao_nao_se_aplica':avaliacao_nao_se_aplica,
        })

    except Exception as e:
        print("Erro ao verificar prontuário:", e)
        raise Http404


def contar_pendencias_dia(request):
    """Conta pendências totais do dia para a agenda do profissional"""
    try:
        dia_str = request.GET.get('dia')
        try:
            dia = date.fromisoformat(dia_str) if dia_str else date.today()
        except ValueError:
            dia = date.today()

        profissional_id = request.GET.get('profissional_id', 1)  # Ou pega do user logado
        profissional = Profissional.objects.filter(id=profissional_id).first()
        
        agendamentos = Agendamento.objects.filter(
            profissional_1=profissional,
            data=dia
        )
        
        prontuarios_pendente = 0
        evolucoes_pendente = 0
        avaliacoes_pendente = 0
        
        for agendamento in agendamentos:
            prontuario = Prontuario.objects.filter(agendamento=agendamento).first()
            if not prontuario or (not prontuario.foi_preenchido and not prontuario.nao_se_aplica):
                prontuarios_pendente += 1
                
            evolucao = Evolucao.objects.filter(agendamento=agendamento).first()
            if not evolucao or (not evolucao.foi_preenchido and not evolucao.nao_se_aplica):
                evolucoes_pendente += 1
                
            avaliacao = AvaliacaoFisioterapeutica.objects.filter(agendamento=agendamento).first()
            if not avaliacao or (not avaliacao.foi_preenchido and not avaliacao.nao_se_aplica):
                avaliacoes_pendente += 1

        return JsonResponse({
            'prontuarios_pendente': prontuarios_pendente,
            'evolucoes_pendente': evolucoes_pendente,
            'avaliacoes_pendente': avaliacoes_pendente,
            'total_agendamentos': agendamentos.count(),
            'dia': dia.isoformat()
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def paciente_detalhes_basicos(request, paciente_id):
    try:
        paciente = Paciente.objects.get(id=paciente_id)

        proxima_consulta = (
    Agendamento.objects.filter(paciente=paciente, data__gte=timezone.now()).order_by('data').first()
)

        foto_url = (
        paciente.foto.url
        if (paciente.foto and paciente.foto.name)       
        else static('core/img/defaultPerfil.png')       
)
        dados = {
            'success': True,
            'paciente': {
                'id': paciente.id,
                'nome':f'{paciente.nome} {paciente.sobrenome}',
                'idade': paciente.idade_formatada,
                'telefone': paciente.telefone,
                'email':paciente.email,
                'foto': request.build_absolute_uri(foto_url), 
                'inicio_tratamento':paciente.data_cadastro.strftime('%d/%m/%Y'),
                'proxima_consulta':f"{proxima_consulta.data.strftime('%d/%m/%Y')} às {proxima_consulta.hora_inicio.strftime('%H:%M')} com {proxima_consulta.profissional_1}" if proxima_consulta  else 'Sem próximo agendamento',

            }
        }
        return JsonResponse(dados)
    except Paciente.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Paciente não encontrado'})
 
import json
from decimal import Decimal, InvalidOperation

@login_required
@require_POST
def api_registrar_pagamento(request, receita_id):
    receita = get_object_or_404(Receita, id=receita_id)

    # ---------------------------------
    # SUPORTE A JSON E FORM-DATA
    # ---------------------------------
    data = request.POST
    if not data:
        try:
            data = json.loads(request.body.decode())
        except:
            return JsonResponse({'error': 'Dados inválidos'}, status=400)

    # ---------------------------------
    # VALOR
    # ---------------------------------
    valor_raw = (
        data.get('valor')
        or data.get('valor_pago')
    )

    if not valor_raw:
        return JsonResponse({'error': 'Valor não informado'}, status=400)

    try:
        valor = Decimal(str(valor_raw))
    except (InvalidOperation, TypeError):
        return JsonResponse({'error': 'Valor inválido'}, status=400)

    if valor <= 0:
        return JsonResponse({'error': 'Valor deve ser maior que zero'}, status=400)

    # ---------------------------------
    # FORMA DE PAGAMENTO
    # ---------------------------------
    forma_pagamento = data.get('forma_pagamento')
    if not forma_pagamento:
        return JsonResponse({'error': 'Forma de pagamento não informada'}, status=400)

    data_pagamento = data.get('data_pagamento') or timezone.localdate()

    # ---------------------------------
    # REGRAS DE NEGÓCIO
    # ---------------------------------
    if receita.saldo <= Decimal('0.00'):
        return JsonResponse({'error': 'Receita já está quitada'}, status=400)

    if valor > receita.saldo:
        return JsonResponse({
            'error': f'Valor excede o saldo da receita (R$ {receita.saldo})'
        }, status=400)

    # ---------------------------------
    # SERVICE
    # ---------------------------------
    pagamento = criar_pagamento(
        receita=receita,
        paciente=receita.paciente,
        pacote=receita.pacote,
        agendamento=None,
        valor=valor,
        forma_pagamento=forma_pagamento,
        data_pagamento=data_pagamento
    )

    return JsonResponse({
        'success': True,
        'receita_id': receita.id,
        'pagamento_id': pagamento.id,
        'novo_saldo': f'{receita.saldo:.2f}',
        'status_receita': receita.status,
    })

 
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from decimal import Decimal
import re

@require_GET
def dados_pagamento(request, receita_id):
    """
    Retorna dados da receita para o modal de pagamento
    Compatível com o JavaScript do frontend
    """
    try:
        # Tenta buscar como Receita
        try:
            receita = get_object_or_404(Receita, id=receita_id)
            
            # Determina o tipo
            tipo = 'manual'  # default
            
            # Verifica se é pacote pela descrição
            import re
            match = re.search(r'Pacote\s+(\w+)', receita.descricao)
            if match:
                tipo = 'pacote'
                
                # Tenta buscar o pacote para dados mais completos
                try:
                    pacote_codigo = match.group(1)
                    pacote = PacotePaciente.objects.get(codigo=pacote_codigo)
                    
                    # Busca primeira sessão para vencimento
                    agqs = Agendamento.objects.filter(
                        pacote=pacote,
                        status__in=['agendado', 'finalizado', 'desistencia_remarcacao', 
                                   'falta_remarcacao', 'falta_cobrada']
                    ).order_by('data', 'hora_inicio', 'id')
                    
                    primeira_sessao = agqs.first() if agqs.exists() else None
                    vencimento = primeira_sessao.data if primeira_sessao else pacote.data_inicio
                    
                    # Formata os dados para pacote
                    return JsonResponse({
                        'success': True,
                        'tipo': 'pacote',
                        'paciente': {
                            'id': pacote.paciente.id,
                            'nome': pacote.paciente.nome
                        },
                        'receita': {
                            'id': receita.id,
                            'descricao': receita.descricao,
                            'valor': float(pacote.valor_final),
                            'saldo': float(pacote.valor_restante),
                            'vencimento': vencimento.strftime('%Y-%m-%d') if vencimento else None
                        }
                    })
                except PacotePaciente.DoesNotExist:
                    # Pacote não encontrado, usa dados da receita
                    pass
            
            # Para receitas manuais ou pacotes não encontrados
            return JsonResponse({
                'success': True,
                'tipo': tipo,
                'paciente': {
                    'id': receita.paciente.id if receita.paciente else None,
                    'nome': receita.paciente.nome if receita.paciente else 'Sem paciente vinculado'
                },
                'receita': {
                    'id': receita.id,
                    'descricao': receita.descricao,
                    'valor': float(receita.valor),
                    'saldo': float(receita.saldo),
                    'vencimento': receita.vencimento.strftime('%Y-%m-%d') if receita.vencimento else None
                }
            })
            
        except Receita.DoesNotExist:
            # Se não for receita, pode ser que o ID seja de um pacote direto
            try:
                pacote = get_object_or_404(PacotePaciente, id=receita_id)
                
                # Busca primeira sessão para vencimento
                agqs = Agendamento.objects.filter(
                    pacote=pacote,
                    status__in=['agendado', 'finalizado', 'desistencia_remarcacao', 
                               'falta_remarcacao', 'falta_cobrada']
                ).order_by('data', 'hora_inicio', 'id')
                
                primeira_sessao = agqs.first() if agqs.exists() else None
                vencimento = primeira_sessao.data if primeira_sessao else pacote.data_inicio
                
                return JsonResponse({
                    'success': True,
                    'tipo': 'pacote',
                    'paciente': {
                        'id': pacote.paciente.id,
                        'nome': pacote.paciente.nome
                    },
                    'receita': {
                        'id': pacote.id,  # ID do pacote, não da receita
                        'descricao': f"Pacote {pacote.codigo}",
                        'valor': float(pacote.valor_final),
                        'saldo': float(pacote.valor_restante),
                        'vencimento': vencimento.strftime('%Y-%m-%d') if vencimento else None
                    }
                })
                
            except PacotePaciente.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'error': 'Registro não encontrado'
                }, status=404)
                
    except Exception as e:
        print(f"Erro em dados_pagamento: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)



@require_POST
@csrf_exempt
def criar_receita_manual(request):
    """
    Cria uma receita manual para um paciente
    """
    try:
        data = json.loads(request.body)
        print("=== CRIAR RECEITA MANUAL ===")
        print("Dados recebidos:", data)
        
        # Validação de campos obrigatórios
        required_fields = ['paciente_id', 'categoria_id', 'descricao', 'valor']
        for field in required_fields:
            if field not in data or not data[field]:
                return JsonResponse({
                    'success': False,
                    'message': f'Campo obrigatório faltando: {field}'
                }, status=400)
        
        # Buscar paciente
        paciente = get_object_or_404(Paciente, id=data['paciente_id'])
        
        # Buscar categoria
        categoria = get_object_or_404(CategoriaContasReceber, id=data['categoria_id'])
        print(categoria)
        # Preparar dados para a receita
        descricao = data['descricao'].strip()
        valor = Decimal(str(data['valor']))
        forma_pagamento = data['forma_pagamento']
        data_vencimento = data.get('data_vencimento', timezone.now().date())
        status = data.get('status', 'pendente')
        
        # Criar a receita
        receita = Receita.objects.create(
            paciente=paciente,
            categoria_receita=categoria,
            descricao=descricao,
            valor=valor,
            vencimento=data_vencimento,
            status=status,
            forma_pagamento=forma_pagamento if status == 'pago' else None  # Só preenche se já pago
        )
        
        print(f"Receita criada: ID #{receita.id} - {descricao}")
        
        # Se já foi marcado como pago, criar pagamento
        if status == 'pago' and data.get('data_pagamento'):
            pagamento = Pagamento.objects.create(
                paciente=paciente,
                receita=receita,
                valor=valor,
                data=data.get('data_pagamento'),
                forma_pagamento=forma_pagamento,
                status='pago',
                vencimento=data_vencimento,
                observacoes=data.get('observacoes', f'Receita manual: {descricao}')
            )
            print(f"Pagamento criado: ID #{pagamento.id}")
            
            # Atualizar status da receita
            receita.atualizar_status_por_pagamentos()
        
        # Gerar comprovante se solicitado
        comprovante_url = None
        if data.get('gerar_comprovante'):
            comprovante_url = gerar_comprovante_pagamento(pagamento.id if status == 'pago' else None)
        
        return JsonResponse({
            'success': True,
            'message': 'Receita manual criada com sucesso!',
            'receita_id': receita.id,
            'pagamento_id': pagamento.id if status == 'pago' else None,
            'comprovante_url': comprovante_url
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Erro ao processar JSON da requisição'
        }, status=400)
    except Paciente.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Paciente não encontrado'
        }, status=404)
    except CategoriaFinanceira.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Categoria financeira não encontrada'
        }, status=404)
    except Exception as e:
        print(f"ERRO ao criar receita manual: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'message': f'Erro interno: {str(e)}'
        }, status=500)


def gerar_comprovante_pagamento(pagamento_id=None):
    """
    Função auxiliar para gerar comprovante de pagamento
    (Implementação básica - você pode expandir conforme necessário)
    """
    if not pagamento_id:
        return None
    
    # Aqui você pode implementar a geração de PDF
    # Por enquanto, retorna uma URL fictícia
    return f"/comprovantes/pagamento/{pagamento_id}/"
 
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

        nao_se_aplica = data.get('nao_se_aplica', False)
                
        if nao_se_aplica:
            prontuario = Prontuario.objects.create(
                paciente_id=data['paciente_id'],
                profissional_id=data['profissional_id'],
                agendamento_id=data.get('agendamento_id'),
                queixa_principal='',
                feedback_paciente='',
                evolucao='',
                conduta='',
                diagnostico='',
                observacoes='',
                foi_preenchido=False,   
                nao_se_aplica=True,     
            )
            print(prontuario)
        else:
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
            
            registrar_log(usuario=request.user,
                acao='Criação',
                modelo='Prontuario',
                objeto_id=prontuario.id,
                descricao=f'Novo prontuário criado para {prontuario.paciente.nome}')
 
        return JsonResponse({
            'success': True,
            'message': 'Prontuário salvo com sucesso!',
            'prontuario_id': prontuario.id,
            'data_criacao': prontuario.data_criacao.isoformat()
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

def listar_prontuarios(request, paciente_id):
    try:
        prontuarios = Prontuario.objects.filter(
            paciente_id=paciente_id
        ).select_related('profissional', 'agendamento').exclude(nao_se_aplica=True).order_by('-data_criacao')[:3]
        
        prontuarios_data = []
        for prontuario in prontuarios:
            prontuarios_data.append({
                'id': prontuario.id,
                'data': prontuario.data_criacao.strftime('%d/%m/%Y'),
                'data_completa': prontuario.data_criacao.strftime('%d/%m/%Y - %H:%M'),
                'agendamento_atual_id':prontuario.agendamento.id,
                'agendamento_atual': prontuario.agendamento.data.strftime('%d/%m/%Y') if prontuario.agendamento else 'Não informado',
                'profissional_nome': prontuario.profissional.nome if prontuario.profissional else 'Não informado',
                'profissional_id': prontuario.profissional.id if prontuario.profissional else None,
                'queixa_principal': prontuario.queixa_principal or '',
                'queixa_preview': (prontuario.queixa_principal[:100] + '...') if prontuario.queixa_principal and len(prontuario.queixa_principal) > 100 else (prontuario.queixa_principal or ''),
                'feedback_paciente': prontuario.feedback_paciente or '',
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

        nao_se_aplica = data.get('nao_se_aplica', False)

        if nao_se_aplica:
            evolucao = Evolucao.objects.create(
                paciente_id=data['paciente_id'],
                profissional_id=data['profissional_id'],
                agendamento_id=data.get('agendamento_id'),
                nao_se_aplica=True,
                queixa_principal_inicial="",
                processo_terapeutico="",
                condutas_tecnicas="",
                resposta_paciente="",
                intercorrencias="",
                dor_inicio=None,
                dor_atual=None,
                dor_observacoes="",
                amplitude_inicio=None,
                amplitude_atual=None,
                amplitude_observacoes="",
                forca_inicio=None,
                forca_atual=None,
                forca_observacoes="",
                postura_inicio=None,
                postura_atual=None,
                postura_observacoes="",
                edema_inicio=None,
                edema_atual=None,
                edema_observacoes="",
                avds_inicio=None,
                avds_atual=None,
                avds_observacoes="",
                emocionais_inicio=None,
                emocionais_atual=None,
                emocionais_observacoes="",
                sintese_evolucao="",
                mensagem_paciente="",
                explicacao_continuidade="",
                reacoes_paciente="",
                dor_expectativa=None,
                dor_realidade=None,
                energia_expectativa=None,
                energia_realidade=None,
                consciencia_expectativa=None,
                consciencia_realidade=None,
                emocao_expectativa=None,
                emocao_realidade=None,
                objetivos_ciclo="",
                condutas_mantidas="",
                ajustes_plano="",
                outro_complementar_texto="",
                observacoes_internas="",
                orientacoes_grupo="",
                foi_preenchido=False,  # ok deixar ou remover também
            )


            print("Nao se aplica")
        else:
            evolucao = Evolucao.objects.create(
                paciente_id=data['paciente_id'],
                profissional_id=data['profissional_id'],
                agendamento_id=data.get('agendamento_id'),
                queixa_principal_inicial=data.get('queixa_principal'),
                processo_terapeutico=data.get('processo_terapeutico'),
                condutas_tecnicas=data.get('condutas_tecnicas'),
                resposta_paciente=data.get('resposta_paciente'),
                intercorrencias=data.get('intercorrencias'),
                dor_inicio=int(data.get('dor_inicio') or 0),
                dor_atual=int(data.get('dor_atual') or 0),
                dor_observacoes=data.get('dor_observacoes'),
                amplitude_inicio=int(data.get('amplitude_inicio') or 0),
                amplitude_atual=int(data.get('amplitude_atual') or 0),
                amplitude_observacoes=data.get('amplitude_observacoes'),
                forca_inicio=int(data.get('forca_inicio') or 0),
                forca_atual=int(data.get('forca_atual') or 0),
                forca_observacoes=data.get('forca_observacoes'),
                postura_inicio=int(data.get('postura_inicio') or 0),
                postura_atual=int(data.get('postura_atual') or 0),
                postura_observacoes=data.get('postura_observacoes'),
                edema_inicio=int(data.get('edema_inicio') or 0),
                edema_atual=int(data.get('edema_atual') or 0),
                edema_observacoes=data.get('edema_observacoes'),
                avds_inicio=int(data.get('advs_inicio') or 0),
                avds_atual=int(data.get('advs_atual') or 0),
                avds_observacoes=data.get('advs_observacoes'),
                emocionais_inicio=int(data.get('asp_emocionais_inicio') or 0),
                emocionais_atual=int(data.get('asp_emocionais_atual') or 0),
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
            print("Se aplica")
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
    try:
        evolucoes = Evolucao.objects.filter(
            paciente_id=paciente_id
        ).select_related('profissional', 'agendamento').exclude(nao_se_aplica=True).order_by('-data_criacao')[:3]
        
        evolucoes_data = []
        for evolucao in evolucoes:
            evolucoes_data.append({
                'id': evolucao.id,
                'data': evolucao.data_criacao.strftime('%d/%m/%Y'),
                'data_completa': evolucao.data_criacao.strftime('%d/%m/%Y - %H:%M'),
                'agendamento_atual_id':evolucao.agendamento.id,
                'agendamento_atual': evolucao.agendamento.data.strftime('%d/%m/%Y') if evolucao.agendamento else 'Não informado',
                'profissional_nome': evolucao.profissional.nome if evolucao.profissional else 'Não informado',
                'profissional_id': evolucao.profissional.id if evolucao.profissional else None,
                 
 
            })
            from django.conf import settings
            from django.utils import timezone
            print("=== DEBUG TIMEZONE ===")
            print("TIME_ZONE no settings:", settings.TIME_ZONE)
            print("Data criacao (raw):", evolucao.data_criacao)
            print("Data criacao (localtime):", timezone.localtime(evolucao.data_criacao))
            print("Data formatada:", timezone.localtime(evolucao.data_criacao).strftime('%d/%m/%Y - %H:%M'))
        return JsonResponse({
            'success': True,
            'evolucoes': evolucoes_data,
            'total': len(evolucoes_data)
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e),
            'prontuarios': []
        }, status=500)
        
        
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
            criado_por = request.user if request.user.is_authenticated else None

            nao_se_aplica = data.get('nao_se_aplica', False)
            print(f'nao_se_aplica {nao_se_aplica}')
            
            
            if nao_se_aplica:
                print("entrou no bloco ")
                avaliacao = AvaliacaoFisioterapeutica.objects.create(
                    paciente_id=data['paciente_id'],
                    profissional_id=data['profissional_id'],
                    agendamento_id=data.get('agendamento_id'),
                    criado_por=criado_por,
                    foi_preenchido=False,
                    nao_se_aplica=True,
                    queixa_principal="",
                    inicio_problema="",
                    causa_problema="",
                    dor_recente_antiga="",
                    episodios_anteriores="",
                    qual_tratamento="",
                    cirurgia_procedimento="",
                    medico_especialidade="",
                    diagnostico_medico="",
                    uso_medicamentos="",
                    tipo_exame="",
                    historico_lesoes="",
                    doencas_previas="",
                    cirurgias_previas="",
                    condicoes_geneticas="",
                    historico_familiar="",
                    qualidade_sono="",
                    horas_sono=None,
                    alimentacao="",
                    nivel_atividade="",
                    tipo_exercicio="",
                    nivel_estresse=None,
                    rotina_trabalho="",
                    aspectos_emocionais="",
                    localizacao_dor="",
                    tipo_dor_outra_texto="",
                    intensidade_repouso=None,
                    intensidade_movimento=None,
                    intensidade_pior=None,
                    fatores_agravam="",
                    fatores_aliviam="",
                    sinal_outro_texto="",
                    grau_inflamacao="",
                    inspecao_postura="",
                    compensacoes_corporais="",
                    padrao_respiratorio="",
                    palpacao="",
                    pontos_dor="",
                    testes_funcionais="",
                    outras_observacoes="",
                    diagnostico_completo="",
                    grau_dor=None,
                    limitacao_funcional=None,
                    grau_inflamacao_num=None,
                    grau_edema=None,
                    receptividade="",
                    autonomia_avd="",
                    objetivo_geral="",
                    objetivo_principal="",
                    objetivo_secundario="",
                    pontos_atencao="",
                    tecnica_outras_texto="",
                    recurso_outro_texto="",
                    descricao_plano="",
                    frequencia=None,
                    duracao=None,
                    reavaliacao_sessao="",
                    evolucao_primeira_sessao="",
                    evolucao_proximas_sessoes="",
                    expectativas_primeira_etapa="",
                    proximos_passos="",
                    sobre_orientacoes="",
                    sono_rotina="",
                    postura_ergonomia="",
                    alimentacao_hidratacao="",
                    exercicios_casa="",
                    aspectos_emocionais_espirituais="",
                    observacoes_finais="",
                )
            
            else:
                   # Coletar dados da tabela de mobilidade
                mobilidade_items = []
                mobilidade_data = data.get('mobilidade_items', [])
                
                # Se vier como string (JSON), converter para lista
                if isinstance(mobilidade_data, str):
                    try:
                        mobilidade_data = json.loads(mobilidade_data)
                    except json.JSONDecodeError:
                        mobilidade_data = []
                
                for item in mobilidade_data:
                    if item.get('regiao_grupo'):  # Só adiciona se tiver região
                        mobilidade_items.append({
                            'regiao_grupo': item.get('regiao_grupo', ''),
                            'adm_ativa': int(item.get('adm_ativa', 0)) if item.get('adm_ativa') else None,
                            'adm_passiva': int(item.get('adm_passiva', 0)) if item.get('adm_passiva') else None,
                            'dor_adm': bool(item.get('dor_adm', False)),
                            'forca_muscular': int(item.get('forca_muscular', 0)) if item.get('forca_muscular') else None,
                            'dor_forca': bool(item.get('dor_forca', False))
                        })

                avaliacao = AvaliacaoFisioterapeutica.objects.create(
                    paciente_id=data['paciente_id'],
                    profissional_id=data['profissional_id'],
                    agendamento_id=data.get('agendamento_id'),
                    criado_por=criado_por,
                    queixa_principal=data.get('queixa_principal', ""),
                    inicio_problema=data.get('inicio_problema', ""),
                    causa_problema=data.get('causa_problema', ""),
                    dor_recente_antiga=data.get('dor_recente_antiga', ""),
                    episodios_anteriores=data.get('episodios_anteriores', ""),
                    tratamento_anterior=data.get('tratamento_anterior'),
                    qual_tratamento=data.get('qual_tratamento', ""),
                    cirurgia_procedimento=data.get('cirurgia_procedimento', ""),
                    acompanhamento_medico=data.get('acompanhamento_medico'),
                    medico_especialidade=data.get('medico_especialidade', ""),
                    diagnostico_medico=data.get('diagnostico_medico', ""),
                    uso_medicamentos=data.get('uso_medicamentos', ""),
                    exames_trazidos=data.get('exames_trazidos'),
                    tipo_exame=data.get('tipo_exame', ""),
                    historico_lesoes=data.get('historico_lesoes', ""),
                    doencas_previas=data.get('doencas_previas', ""),
                    cirurgias_previas=data.get('cirurgias_previas', ""),
                    historico_familiar=data.get('historico_familiar', ""),
                    qualidade_sono=data.get('qualidade_sono', ""),
                    horas_sono=data.get('horas_sono', ""),
                    alimentacao=data.get('alimentacao', ""),
                    nivel_atividade=data.get('nivel_atividade', ""),
                    tipo_exercicio=data.get('tipo_exercicio', ""),
                    nivel_estresse=int(data.get('nivel_estresse') or 0),
                    rotina_trabalho=data.get('rotina_trabalho', ""),
                    aspectos_emocionais=data.get('aspectos_emocionais', ""),
                    localizacao_dor=data.get('localizacao_dor', ""),
                    tipo_dor_pontada=data.get('tipo_dor_pontada'),
                    tipo_dor_queimacao=data.get('tipo_dor_queimacao'),
                    tipo_dor_peso=data.get('tipo_dor_peso'),
                    tipo_dor_choque=data.get('tipo_dor_choque'),
                    tipo_dor_outra=data.get('tipo_dor_outra'),
                    tipo_dor_outra_texto=data.get('tipo_dor_outra_texto', ""),
                    intensidade_repouso=int(data.get('intensidade_repouso') or 0),
                    intensidade_movimento=int(data.get('intensidade_movimento') or 0),
                    intensidade_pior=int(data.get('intensidade_pior') or 0),
                    fatores_agravam=data.get('fatores_agravam', ""),
                    fatores_aliviam=data.get('fatores_aliviam', ""),
                    sinal_edema=data.get('sinal_edema'),
                    sinal_parestesia=data.get('sinal_parestesia'),
                    sinal_rigidez=data.get('sinal_rigidez'),
                    sinal_fraqueza=data.get('sinal_fraqueza'),
                    sinal_compensacoes=data.get('sinal_compensacoes'),
                    sinal_outro=data.get('sinal_outro'),
                    sinal_outro_texto=data.get('sinal_outro_texto', ""),
                    grau_inflamacao=data.get('grau_inflamacao', ""),
                    inspecao_postura=data.get('inspecao_postura', ""),
                    compensacoes_corporais=data.get('compensacoes_corporais', ""),
                    padrao_respiratorio=data.get('padrao_respiratorio', ""),
                    palpacao=data.get('palpacao', ""),
                    pontos_dor=data.get('pontos_dor', ""),
                    testes_funcionais=data.get('testes_funcionais', ""),
                    outras_observacoes=data.get('outras_observacoes', ""),
                    diagnostico_completo=data.get('diagnostico_completo', ""),
                    grau_dor=int(data.get('grau_dor') or 0),
                    limitacao_funcional=int(data.get('limitacao_funcional') or 0),
                    grau_inflamacao_num=int(data.get('grau_inflamacao_num') or 0),
                    grau_edema=int(data.get('grau_edema') or 0),
                    receptividade=data.get('receptividade', ""),
                    autonomia_avd=data.get('autonomia_avd', ""),
                    objetivo_geral=data.get('objetivo_geral', ""),
                    objetivo_principal=data.get('objetivo_principal', ""),
                    objetivo_secundario=data.get('objetivo_secundario', ""),
                    pontos_atencao=data.get('pontos_atencao', ""),
                    tecnica_liberacao=data.get('tecnica_liberacao'),
                    tecnica_mobilizacao=data.get('tecnica_mobilizacao'),
                    tecnica_dry_needling=data.get('tecnica_dry_needling'),
                    tecnica_ventosa=data.get('tecnica_ventosa'),
                    tecnica_manipulacoes=data.get('tecnica_manipulacoes'),
                    tecnica_outras=data.get('tecnica_outras'),
                    tecnica_outras_texto=data.get('tecnica_outras_texto', ""),
                    recurso_aussie=data.get('recurso_aussie'),
                    recurso_russa=data.get('recurso_russa'),
                    recurso_aussie_tens=data.get('recurso_aussie_tens'),
                    recurso_us=data.get('recurso_us'),
                    recurso_termo=data.get('recurso_termo'),
                    recurso_outro=data.get('recurso_outro'),
                    recurso_outro_texto=data.get('recurso_outro_texto', ""),
                    cinesio_fortalecimento=data.get('cinesio_fortalecimento'),
                    cinesio_alongamento=data.get('cinesio_alongamento'),
                    cinesio_postural=data.get('cinesio_postural'),
                    cinesio_respiracao=data.get('cinesio_respiracao'),
                    cinesio_mobilidade=data.get('cinesio_mobilidade'),
                    cinesio_funcional=data.get('cinesio_funcional'),
                    descricao_plano=data.get('descricao_plano', ""),
                    medo_agulha=data.get('medo_agulha'),
                    limiar_dor_baixo=data.get('limiar_dor_baixo'),
                    fragilidade=data.get('fragilidade'),
                    frequencia=int(data.get('frequencia') or 0),
                    duracao=int(data.get('duracao') or 0),
                    reavaliacao_sessao=data.get('reavaliacao_sessao', ""),
                    evolucao_primeira_sessao=data.get('evolucao_primeira_sessao', ""),
                    evolucao_proximas_sessoes=data.get('evolucao_proximas_sessoes', ""),
                    expectativas_primeira_etapa=data.get('expectativas_primeira_etapa', ""),
                    proximos_passos=data.get('proximos_passos', ""),
                    sobre_orientacoes=data.get('sobre_orientacoes', ""),
                    sono_rotina=data.get('sono_rotina', ""),
                    postura_ergonomia=data.get('postura_ergonomia', ""),
                    alimentacao_hidratacao=data.get('alimentacao_hidratacao', ""),
                    exercicios_casa=data.get('exercicios_casa', ""),
                    aspectos_emocionais_espirituais=data.get('aspectos_emocionais_espirituais', ""),
                    observacoes_finais=data.get('observacoes_finais', ""),
                    mobilidade_regiao=data.get('mobilidade_regiao', ""),
                    mobilidade_ativa=data.get('mobilidade_ativa', ""),
                    mobilidade_passiva=data.get('mobilidade_passiva', ""),
                    mobilidade_dor=data.get('mobilidade_dor', ""),
                    forca_grupo=data.get('forca_grupo', ""),
                    forca_grau=data.get('forca_grau', ""),
                    forca_dor=data.get('forca_dor', ""),
                     
                    foi_preenchido=True,
                )
            
 
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
    try:
        avaliacoes = AvaliacaoFisioterapeutica.objects.filter(
            paciente_id=paciente_id
        ).select_related('profissional', 'agendamento').exclude(nao_se_aplica=True).order_by('-data_avaliacao')[:3]
        
        avaliacoes_data = []
        for avaliacao in avaliacoes:
            avaliacoes_data.append({
                'id': avaliacao.id,
                'data': avaliacao.data_avaliacao.strftime('%d/%m/%Y'),
                'data_completa': avaliacao.data_avaliacao.strftime('%d/%m/%Y - %H:%M'),
                'agendamento_atual_id':avaliacao.agendamento.id,
                'agendamento_atual': avaliacao.agendamento.data.strftime('%d/%m/%Y') if avaliacao.agendamento else 'Não informado',
                'profissional_nome': avaliacao.profissional.nome if avaliacao.profissional else 'Não informado',
                'profissional_id': avaliacao.profissional.id if avaliacao.profissional else None,
                 
 
            })
             
        return JsonResponse({
            'success': True,
            'avaliacoes': avaliacoes_data,
            'total': len(avaliacoes_data)
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e),
            'avaliacoes': []
        }, status=500)

def detalhes_prontuario(request, agendamento_id):
    try:
        prontuarios = Prontuario.objects.filter(
            agendamento_id=agendamento_id
        ).select_related('profissional', 'agendamento').exclude(nao_se_aplica=True).order_by('-data_criacao')[:3]
        
        prontuarios_data = []
        for prontuario in prontuarios:
            prontuarios_data.append({
                'id': prontuario.id,
                'data': prontuario.data_criacao.strftime('%d/%m/%Y'),
                'data_completa': prontuario.data_criacao.strftime('%d/%m/%Y - %H:%M'),
                'pacote':prontuario.agendamento.pacote.codigo,
                'agendamento_atual_id':prontuario.agendamento.id,
                'nome_paciente':f'{prontuario.paciente.nome} {prontuario.paciente.sobrenome}',
                'agendamento_atual': prontuario.agendamento.data.strftime('%d/%m/%Y') if prontuario.agendamento else 'Não informado',
                'profissional_nome': prontuario.profissional.nome if prontuario.profissional else 'Não informado',
                'profissional_id': prontuario.profissional.id if prontuario.profissional else None,
                'queixa_principal': prontuario.queixa_principal or '',
                'feedback_paciente': prontuario.feedback_paciente or '',
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


def detalhes_evolucao(request, agendamento_id):
    try:
        evolucoes = Evolucao.objects.filter(
            agendamento_id=agendamento_id
        ).select_related('profissional', 'agendamento').exclude(nao_se_aplica=True).order_by('-data_criacao')[:3]
        
        evolucao_data = []
        for evolucao in evolucoes:
            evolucao_data.append({
                'id': evolucao.id,
                'data': evolucao.data_criacao.strftime('%d/%m/%Y'),
                'data_completa': evolucao.data_criacao.strftime('%d/%m/%Y - %H:%M'),
                'pacote':evolucao.agendamento.pacote.codigo,
                'agendamento_atual_id':evolucao.agendamento.id,
                'nome_paciente':f'{evolucao.paciente.nome} {evolucao.paciente.sobrenome}',
                'agendamento_atual': evolucao.agendamento.data.strftime('%d/%m/%Y') if evolucao.agendamento else 'Não informado',
                'profissional_nome': evolucao.profissional.nome if evolucao.profissional else 'Não informado',
                'profissional_id': evolucao.profissional.id if evolucao.profissional else None,
                'queixa_principal_inicial':evolucao.queixa_principal_inicial,
                'processo_terapeutico':evolucao.processo_terapeutico,
                'condutas_tecnicas':evolucao.condutas_tecnicas,
                'resposta_paciente':evolucao.resposta_paciente,
                'intercorrencias':evolucao.intercorrencias,
                # Dores (tudo junto)
                'dor_inicio':evolucao.dor_inicio,
                'dor_atual':evolucao.dor_atual,
                'dor_observacoes':evolucao.dor_observacoes,
                # Amplitude  (tudo junto)
                'amplitude_inicio':evolucao.amplitude_inicio,
                'amplitude_atual':evolucao.amplitude_atual,
                'amplitude_observacoes':evolucao.amplitude_observacoes,
                # Força  (tudo junto)
                'forca_inicio':evolucao.forca_inicio,
                'forca_atual':evolucao.forca_atual,
                'forca_observacoes':evolucao.forca_observacoes,
                # Postura  (tudo junto)
                'postura_inicio':evolucao.postura_inicio,
                'postura_atual':evolucao.postura_atual,
                'postura_observacoes':evolucao.postura_observacoes,
                # Edema  (tudo junto)
                'edema_inicio':evolucao.edema_inicio,
                'edema_atual':evolucao.edema_atual,
                'edema_observacoes':evolucao.edema_observacoes,
                # AVDS  (tudo junto)
                'avds_inicio':evolucao.avds_inicio,
                'avds_atual':evolucao.avds_atual,
                'avds_observacoes':evolucao.avds_observacoes,
                # Emocionais  (tudo junto)
                'emocionais_inicio':evolucao.emocionais_inicio,
                'emocionais_atual':evolucao.emocionais_atual,
                'emocionais_observacoes':evolucao.emocionais_observacoes,
                
                'sintese_evolucao':evolucao.sintese_evolucao,
                'mensagem_paciente':evolucao.mensagem_paciente,
                'explicacao_continuidade':evolucao.explicacao_continuidade,
                'reacoes_paciente':evolucao.reacoes_paciente,
                # Expectativa x Realidade - dor
                'dor_expectativa':evolucao.dor_expectativa,
                'dor_realidade':evolucao.dor_realidade,
                
                # Expectativa x Realidade - mobilidade
                'mobilidade_expectativa':evolucao.mobilidade_expectativa,
                'mobilidade_realidade':evolucao.mobilidade_realidade,
                # Expectativa x Realidade - energia
                'energia_expectativa':evolucao.energia_expectativa,
                'energia_realidade':evolucao.energia_realidade,
                # Expectativa x Realidade - consciencia
                'consciencia_expectativa':evolucao.consciencia_expectativa,
                'consciencia_realidade':evolucao.consciencia_realidade,
                # Expectativa x Realidade - emocao
                'emocao_expectativa':evolucao.emocao_expectativa,
                'emocao_realidade':evolucao.emocao_realidade,
                
                # Próximos passos
                'objetivos_ciclo':evolucao.objetivos_ciclo,
                'condutas_mantidas':evolucao.condutas_mantidas,
                'ajustes_plano':evolucao.ajustes_plano,
                
                # Sugestões complementares
                'treino_funcional':evolucao.treino_funcional,
                'pilates_clinico':evolucao.pilates_clinico,
                'recovery':evolucao.recovery,
                'rpg':evolucao.rpg,
                'nutricao':evolucao.nutricao,
                'psicoterapia':evolucao.psicoterapia,
                'estetica':evolucao.estetica,
                'outro_complementar':evolucao.outro_complementar,
                'outro_complementar_texto':evolucao.outro_complementar_texto,
                # Registro interno
                'observacoes_internas':evolucao.observacoes_internas,
                'orientacoes_grupo':evolucao.orientacoes_grupo,
            })
        
        return JsonResponse({
            'success': True,
            'evolucoes': evolucao_data,
            'total': len(evolucao_data)
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e),
            'prontuarios': []
        }, status=500)

def detalhes_avaliacao(request, agendamento_id):
    try:
        avaliacoes = AvaliacaoFisioterapeutica.objects.filter(
            agendamento_id=agendamento_id
        ).select_related('profissional', 'agendamento').exclude(nao_se_aplica=True).order_by('-data_avaliacao')[:3]
        
        avaliacoes_data = []
        for avaliacao in avaliacoes:
            avaliacoes_data.append({
                'id': avaliacao.id,
                'data': avaliacao.data_avaliacao.strftime('%d/%m/%Y'),
                'data_completa': avaliacao.data_avaliacao.strftime('%d/%m/%Y - %H:%M'),
                'pacote':avaliacao.agendamento.pacote.codigo,
                'agendamento_atual_id':avaliacao.agendamento.id,
                'nome_paciente':f'{avaliacao.paciente.nome} {avaliacao.paciente.sobrenome}',
                'agendamento_atual': avaliacao.agendamento.data.strftime('%d/%m/%Y') if avaliacao.agendamento else 'Não informado',
                'profissional_nome': avaliacao.profissional.nome if avaliacao.profissional else 'Não informado',
                'profissional_id': avaliacao.profissional.id if avaliacao.profissional else None,
                'queixa_principal': avaliacao.queixa_principal,
                'inicio_problema': avaliacao.inicio_problema,
                'causa_problema': avaliacao.causa_problema,
                
                'dor_recente_antiga': avaliacao.dor_recente_antiga,
                'episodios_anteriores': avaliacao.episodios_anteriores,
                'tratamento_anterior': "Sim" if avaliacao.tratamento_anterior else 'Não',
                'qual_tratamento': "Não informado" if avaliacao.tratamento_anterior == False else avaliacao.qual_tratamento or 'Não especificado.',
                'cirurgia_procedimento': avaliacao.cirurgia_procedimento,
                'acompanhamento_medico': "Sim" if avaliacao.acompanhamento_medico else 'Não',
                'medico_especialidade': "Não informado" if avaliacao.medico_especialidade == False else avaliacao.medico_especialidade or 'Não especificado.',
                'diagnostico_medico': avaliacao.diagnostico_medico,
                'uso_medicamentos': avaliacao.uso_medicamentos,
                'exames_trazidos': "Sim" if avaliacao.exames_trazidos else 'Não',
                'tipo_exame': "Não informado" if avaliacao.tipo_exame == False else avaliacao.tipo_exame or 'Não especificado.',
                'historico_lesoes': avaliacao.historico_lesoes,
                'doencas_previas': avaliacao.doencas_previas,
                'cirurgias_previas': avaliacao.cirurgias_previas,
                'condicoes_geneticas': avaliacao.condicoes_geneticas,
                'historico_familiar': avaliacao.historico_familiar,
                'qualidade_sono': avaliacao.qualidade_sono.capitalize(),
                'horas_sono': avaliacao.horas_sono.capitalize(),
                'alimentacao': avaliacao.alimentacao.capitalize(),
                'nivel_atividade': avaliacao.nivel_atividade.capitalize(),
                'tipo_exercicio': avaliacao.tipo_exercicio.capitalize(),
                'nivel_estresse': avaliacao.nivel_estresse,
                'rotina_trabalho': avaliacao.rotina_trabalho,
                'aspectos_emocionais': avaliacao.aspectos_emocionais,
                'localizacao_dor': avaliacao.localizacao_dor,
                'tipo_dor_pontada': avaliacao.tipo_dor_pontada,
                'tipo_dor_queimacao': avaliacao.tipo_dor_queimacao,
                'tipo_dor_peso': avaliacao.tipo_dor_peso,
                'tipo_dor_choque': avaliacao.tipo_dor_choque,
                'tipo_dor_outra': avaliacao.tipo_dor_outra,
                'tipo_dor_outra_texto': avaliacao.tipo_dor_outra_texto,
                
                'intensidade_repouso': avaliacao.intensidade_repouso,
                'intensidade_movimento': avaliacao.intensidade_movimento,
                'intensidade_pior': avaliacao.intensidade_pior,
                
                'fatores_agravam': avaliacao.fatores_agravam,
                'fatores_aliviam': avaliacao.fatores_aliviam,
                
                'sinal_edema': avaliacao.sinal_edema,
                'sinal_parestesia': avaliacao.sinal_parestesia,
                'sinal_rigidez': avaliacao.sinal_rigidez,
                'sinal_fraqueza': avaliacao.sinal_fraqueza,
                'sinal_compensacoes': avaliacao.sinal_compensacoes,
                'sinal_outro': avaliacao.sinal_outro,
                'sinal_outro_texto': avaliacao.sinal_outro_texto,
                
                'grau_inflamacao': avaliacao.grau_inflamacao,
                
                'inspecao_postura': avaliacao.inspecao_postura,
                'compensacoes_corporais': avaliacao.compensacoes_corporais,
                'padrao_respiratorio': avaliacao.padrao_respiratorio,
                'palpacao': avaliacao.palpacao,
                'pontos_dor': avaliacao.pontos_dor,
                
                
                'mobilidade_regiao': avaliacao.mobilidade_regiao,
                'mobilidade_ativa': avaliacao.mobilidade_ativa,
                'mobilidade_passiva': avaliacao.mobilidade_passiva,
                'mobilidade_dor': avaliacao.mobilidade_dor,
                'forca_grupo': avaliacao.forca_grupo,
                'forca_grau': avaliacao.forca_grau,
                'forca_dor': avaliacao.forca_dor,
                
                'testes_funcionais': avaliacao.testes_funcionais,
                'outras_observacoes': avaliacao.outras_observacoes,
                
                'diagnostico_completo': avaliacao.diagnostico_completo,
                'grau_dor': avaliacao.grau_dor,
                'limitacao_funcional': avaliacao.limitacao_funcional,
                'grau_inflamacao_num': avaliacao.grau_inflamacao_num,
                'grau_edema': avaliacao.grau_edema,
                
                'receptividade': avaliacao.receptividade,
                'autonomia_avd': avaliacao.autonomia_avd,
                'objetivo_geral': avaliacao.objetivo_geral,
                'objetivo_principal': avaliacao.objetivo_principal,
                'objetivo_secundario': avaliacao.objetivo_secundario,
                'pontos_atencao': avaliacao.pontos_atencao,

                'tecnica_liberacao': avaliacao.tecnica_liberacao,
                'tecnica_mobilizacao': avaliacao.tecnica_mobilizacao,
                'tecnica_dry_needling': avaliacao.tecnica_dry_needling,
                'tecnica_ventosa': avaliacao.tecnica_ventosa,
                'tecnica_manipulacoes': avaliacao.tecnica_manipulacoes,
                'tecnica_outras': avaliacao.tecnica_outras,
                'tecnica_outras_texto': avaliacao.tecnica_outras_texto,
                
                'recurso_aussie': avaliacao.recurso_aussie,
                'recurso_russa': avaliacao.recurso_russa,
                'recurso_aussie_tens': avaliacao.recurso_aussie_tens,
                'recurso_us': avaliacao.recurso_us,
                'recurso_termo': avaliacao.recurso_termo,
                'recurso_outro': avaliacao.recurso_outro,
                'recurso_outro_texto': avaliacao.recurso_outro_texto,
                
                'cinesio_fortalecimento': avaliacao.cinesio_fortalecimento,
                'cinesio_alongamento': avaliacao.cinesio_alongamento,
                'cinesio_postural': avaliacao.cinesio_postural,
                'cinesio_respiracao': avaliacao.cinesio_respiracao,
                'cinesio_mobilidade': avaliacao.cinesio_mobilidade,
                'cinesio_funcional': avaliacao.cinesio_funcional,
                
                'descricao_plano': avaliacao.descricao_plano,
                'medo_agulha': avaliacao.medo_agulha,
                'limiar_dor_baixo': avaliacao.limiar_dor_baixo,
                'fragilidade': avaliacao.fragilidade,
                'frequencia': avaliacao.frequencia,
                'duracao': avaliacao.duracao,
                'reavaliacao_sessao': avaliacao.reavaliacao_sessao,
                
                'evolucao_primeira_sessao': avaliacao.evolucao_primeira_sessao,
                'evolucao_proximas_sessoes': avaliacao.evolucao_proximas_sessoes,
                'expectativas_primeira_etapa': avaliacao.expectativas_primeira_etapa,
                'proximos_passos': avaliacao.proximos_passos,
                'sobre_orientacoes': avaliacao.sobre_orientacoes,
                'sono_rotina': avaliacao.sono_rotina,
                'postura_ergonomia': avaliacao.postura_ergonomia,
                'alimentacao_hidratacao': avaliacao.alimentacao_hidratacao,
                'exercicios_casa': avaliacao.exercicios_casa,
                'aspectos_emocionais_espirituais': avaliacao.aspectos_emocionais_espirituais,
                'observacoes_finais': avaliacao.observacoes_finais,

            
            })
        
        return JsonResponse({
            'success': True,
            'avaliacoes': avaliacoes_data,
            'total': len(avaliacoes_data)
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e),
            'avaliacoes': []
        }, status=500)


def salvar_imagem(request):
    ...
    
def listar_imagens(request, paciente_id):
    ...
    
def criar_pasta_imagem(request, paciente_id):
    ...


# views.py
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
from core.models import CategoriaConta, GrupoConta, SubgrupoConta

@csrf_exempt
@require_GET
def api_plano_contas(request):
    """API para retornar o plano de contas no formato esperado pelo frontend"""
    try:
        # Buscar todas as categorias, grupos e contas ativas
        categorias = CategoriaConta.objects.filter(ativo=True)
        grupos = GrupoConta.objects.filter(ativo=True).select_related('categoria')
        contas = SubgrupoConta.objects.filter(ativo=True).select_related('grupo', 'grupo__categoria')
        
        # Formato 1: Simples (array de contas)
        if request.GET.get('formato') == 'simples':
            dados_simples = []
            for conta in contas:
                dados_simples.append({
                    'id': conta.id,
                    'codigo_completo': conta.codigo_completo,
                    'codigo': conta.codigo,
                    'descricao': conta.descricao,
                    'tipo': conta.grupo.categoria.tipo,
                    'grupo_id': conta.grupo.id,
                    'grupo_descricao': conta.grupo.descricao,
                    'categoria_nome': conta.grupo.categoria.nome,
                    'ativo': conta.ativo,
                    'ordem': conta.ordem
                })
            return JsonResponse(dados_simples, safe=False)
        
        # Formato 2: Hierárquico (formato original do frontend)
        else:
            estrutura = {
                "centros_de_custo": {
                    "receitas": {},
                    "despesas": {}
                }
            }
            
            # Processar cada categoria
            for categoria in categorias:
                tipo_key = "receitas" if categoria.tipo == "receita" else "despesas"
                
                # Filtrar grupos desta categoria
                grupos_categoria = grupos.filter(categoria=categoria)
                
                for grupo in grupos_categoria:
                    estrutura["centros_de_custo"][tipo_key][grupo.codigo] = {
                        "descricao": grupo.descricao,
                        "subgrupos": {}
                    }
                    
                    contas_grupo = contas.filter(grupo=grupo)
                    
                    for conta in contas_grupo:
                        codigo_display = f"{grupo.codigo}.{conta.codigo}"
                        estrutura["centros_de_custo"][tipo_key][grupo.codigo]["subgrupos"][codigo_display] = conta.descricao
            
            return JsonResponse(estrutura)
    
    except Exception as e:
        return JsonResponse({
            "error": str(e),
            "centros_de_custo": {
                "receitas": {},
                "despesas": {}
            }
        }, status=500)