from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from core.models import Agendamento, CONSELHO_ESCOLHA, COR_RACA, CategoriaContasReceber, ConfigAgenda, ContaBancaria, ESTADO_CIVIL, EscalaBaseProfissional, Especialidade, Fornecedor, MIDIA_ESCOLHA, MensagemPadrao, Paciente, PacotePaciente, Pagamento, Profissional, SEXO_ESCOLHA, Servico, SubgrupoConta, UF_ESCOLHA, TipoDocumentoEmpresa, User, VINCULO, ValidadeBeneficios, ValidadeReposicao
from core.utils import filtrar_ativos_inativos, alterar_status_ativo, registrar_log
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.template.context_processors import request

@login_required(login_url='login')


def configuracao_view(request):
 
    MODELOS_ATIVAVEIS = {
    'servico': Servico,
    'especialidade': Especialidade,
    'fornecedor':Fornecedor,
    'banco':ContaBancaria,
     
  
}
    '''
    =====================================================================================
                                        CRIAÇÃO
    =====================================================================================
    '''

    if request.method == "POST":
        tipo = request.POST.get('tipo')

        if tipo == "especialidade":
            nome = request.POST.get('nome')
            cor = request.POST.get('cor')
            if nome and cor:
                try:
                    Especialidade.objects.create(nome=nome, cor=cor, ativo=True)
                    print('SALVO COM SUCESSO')
                except Exception as e:
                    print("Erro ao salvar especialidade:", e)
        
        elif tipo == "servico":
            nome = request.POST.get('nome')
            valor = request.POST.get('valor')
            qtd_sessoes = request.POST.get('qtd_sessoes')
            conta_codigo = request.POST.get('conta_codigo')  # Vem como "R11"
            
            if nome and valor and qtd_sessoes:
                try:
                    valor = float(valor.replace(',', '.'))
                    
                    # Inicializa a variável da conta
                    conta_contabil = None
                    
                    if conta_codigo:
                        try:
                            if len(conta_codigo) >= 3:
                                tipo_codigo = conta_codigo[0]  # R ou D
                                grupo_codigo = conta_codigo[1]  # primeiro dígito do grupo
                                subgrupo_codigo = conta_codigo[2:]  # restante para subgrupo
                                codigo_formatado = f"{tipo_codigo}.{grupo_codigo}.{subgrupo_codigo}"
                            else:
                                codigo_formatado = conta_codigo
                            
                            # Procura a conta pelo código formatado
                            conta_contabil = SubgrupoConta.objects.get(
                                codigo_completo=codigo_formatado,
                                ativo=True
                            )
                        except SubgrupoConta.DoesNotExist:
                            print(f"Conta não encontrada: {conta_codigo} (formatado: {codigo_formatado})")
                            # Tenta buscar sem formatação também
                            try:
                                conta_contabil = SubgrupoConta.objects.get(
                                    codigo_completo=conta_codigo,
                                    ativo=True
                                )
                            except SubgrupoConta.DoesNotExist:
                                return JsonResponse({
                                    'success': False, 
                                    'message': f'Conta contábil não encontrada: {conta_codigo}'
                                })
                    
                    # Cria o serviço com a conta
                    Servico.objects.create(
                        nome=nome, 
                        valor=valor, 
                        qtd_sessoes=qtd_sessoes, 
                        ativo=True,
                        conta_contabil=conta_contabil
                    )
                    print('SALVO COM SUCESSO')
                    
                    return JsonResponse({'success': True})
                    
                except Exception as e:
                    print("Erro ao salvar serviço:", e)
                    return JsonResponse({
                        'success': False, 
                        'message': str(e)
                    })
                    
        elif tipo == "usuario_config":
            
            print("→ ENTROU no bloco usuario_config")
            print(request.POST)
            user_id = request.POST.get('usuario_id')
            tipo_usuario = request.POST.get('tipo_usuario')
            valor_hora = request.POST.get('valor_hora')
            valor_hora_str = request.POST.get('valor_hora', '').replace(',', '.')
            valor_hora = float(valor_hora_str) if valor_hora_str else None
            nova_senha = request.POST.get('nova_senha')
            confirma_senha = request.POST.get('confirma_senha')
        

            try:
                user = User.objects.get(id=user_id)
                user.tipo = tipo_usuario
                user.ativo = True

                if nova_senha or confirma_senha:
                    if not nova_senha:
                        messages.error(request, 'Você precisa digitar a nova senha.')
                    elif not confirma_senha:
                        messages.error(request,'Você precisa confirmar a nova senha.')
                    elif nova_senha != confirma_senha:
                        messages.error(request, 'As senhas não coincidem.')
                    else:
                        messages.success(request, 'Senha alterada com sucesso.')
                        user.set_password(nova_senha)

                messages.success(request, 'Alterações realizadas com sucesso.')
                user.save()

                if hasattr(user, 'profissional') and valor_hora is not None:
                    
                    user.profissional.valor_hora = valor_hora
                    user.profissional.save()
 
                print('Usuário atualizado com sucesso!')

            except Exception as e:
                print(f'Erro ao atualizar usuário: {e}')
        
        elif tipo == 'cadastro_bancos':
             
            codigo_banco = request.POST.get('codigo_banco')
            nome_banco = request.POST.get('nome_banco')
            agencia_banco = request.POST.get('agencia_banco')
            conta_banco = request.POST.get('conta_banco')
            digito_banco = request.POST.get('digito_banco')
            chave_pix_banco = request.POST.get('chave_pix_banco')
            tipo_conta_banco = request.POST.get('tipo_conta_banco')
            
            ativo = True
            
            try:
                
               
                ContaBancaria.objects.create(codigo_banco=codigo_banco,
                                            nome_banco=nome_banco,
                                            agencia_banco=agencia_banco,
                                            conta_banco=conta_banco,
                                            digito_banco=digito_banco,
                                            tipo_conta_banco=tipo_conta_banco,
                                            chave_pix_banco=chave_pix_banco,
                                            ativo=ativo)

            except Exception as e:
                print(e)
        
        elif tipo == 'cadastro_fornecedores':
            tipo_pessoa = request.POST.get('tipo_pessoa')
            documento_fornecedor = request.POST.get('documento_fornecedor')
            razao_social_fornecedor = request.POST.get('razao_social_fornecedor')
            fantasia_fornecedor = request.POST.get('fantasia_fornecedor')
            telefone_fornecedor = request.POST.get('telefone_fornecedor')
            email_fornecedor = request.POST.get('email_fornecedor')
            conta_codigo = request.POST.get('conta_codigo')
            ativo = True
            
             
            try:
                
                conta_contabil = None
                
                if conta_codigo:
                    try:
                        if len(conta_codigo) >= 3:
                            tipo_codigo = conta_codigo[0]  # R ou D
                            grupo_codigo = conta_codigo[1]  # primeiro dígito do grupo
                            subgrupo_codigo = conta_codigo[2:]  # restante para subgrupo
                            codigo_formatado = f"{tipo_codigo}.{grupo_codigo}.{subgrupo_codigo}"
                        else:
                            codigo_formatado = conta_codigo
                        
                        # Procura a conta pelo código formatado
                        conta_contabil = SubgrupoConta.objects.get(
                            codigo_completo=codigo_formatado,
                            ativo=True
                        )
                    except SubgrupoConta.DoesNotExist:
                        print(f"Conta não encontrada: {conta_codigo} (formatado: {codigo_formatado})")
                        # Tenta buscar sem formatação também
                        try:
                            conta_contabil = SubgrupoConta.objects.get(
                                codigo_completo=conta_codigo,
                                ativo=True
                            )
                        except SubgrupoConta.DoesNotExist:
                            return JsonResponse({
                                'success': False, 
                                'message': f'Conta contábil não encontrada: {conta_codigo}'
                            })
                            
                Fornecedor.objects.create(tipo_pessoa=tipo_pessoa,
                                            razao_social=razao_social_fornecedor,
                                            nome_fantasia=fantasia_fornecedor,
                                            documento=documento_fornecedor,
                                            telefone=telefone_fornecedor,
                                            email=email_fornecedor,
                                            conta_contabil=conta_contabil,
                                            ativo=ativo)
            except Exception as e:
                print(e)
                            
        elif tipo == 'cadastro_categoria_contas_receber':
            nome = request.POST.get('categoria_nome')
            ativo = True
            conta_codigo = request.POST.get('conta_codigo')
            
            try:
                conta_contabil = None
                
                if conta_codigo:
                    try:
                        if len(conta_codigo) >= 3:
                            tipo_codigo = conta_codigo[0]  # R ou D
                            grupo_codigo = conta_codigo[1]  # primeiro dígito do grupo
                            subgrupo_codigo = conta_codigo[2:]  # restante para subgrupo
                            codigo_formatado = f"{tipo_codigo}.{grupo_codigo}.{subgrupo_codigo}"
                        else:
                            codigo_formatado = conta_codigo
                        
                        # Procura a conta pelo código formatado
                        conta_contabil = SubgrupoConta.objects.get(
                            codigo_completo=codigo_formatado,
                            ativo=True
                        )
                    except SubgrupoConta.DoesNotExist:
                        print(f"Conta não encontrada: {conta_codigo} (formatado: {codigo_formatado})")
                        # Tenta buscar sem formatação também
                        try:
                            conta_contabil = SubgrupoConta.objects.get(
                                codigo_completo=conta_codigo,
                                ativo=True
                            )
                        except SubgrupoConta.DoesNotExist:
                            return JsonResponse({
                                'success': False, 
                                'message': f'Conta contábil não encontrada: {conta_codigo}'
                            })
                            
                CategoriaContasReceber.objects.create(nome=nome,ativo=ativo,conta_contabil=conta_contabil,)
            except Exception as e:
                print(e)
            
        elif tipo == 'config_validade':
            validade_d = request.POST.get('validade_d')
            validade_dcr = request.POST.get('validade_dcr')
            validade_fcr = request.POST.get('validade_fcr')
            beneficios = request.POST.get('beneficios')
            aniversario = request.POST.get('aniversario')
            
            
            if not all([validade_d,validade_dcr,validade_fcr, beneficios, aniversario]):
                messages.error(request, "Todos os campos de validade precisam ser preenchidos.")
                return redirect('configuracoes') + '#agenda'
            
            
            validade_d = int(validade_d)
            validade_dcr = int(validade_dcr)
            validade_fcr = int(validade_fcr)
            beneficios = int(beneficios)
            aniversario = int(aniversario)
            
            
            if not all([1 <= v <= 365 for v in [validade_d, validade_dcr, validade_fcr, beneficios,aniversario]]):
                    messages.error(request, 'Os valores devem estar entre 1 e 365 dias.')
                    return redirect('configuracoes') + '#agenda'
                
                
            tipos_validades = [
                ('d', validade_d),
                ('dcr', validade_dcr),
                ('fcr', validade_fcr)
            ]
            tipos_beneficios_validades = [
                ('beneficio',beneficios ),
                ('aniversario',aniversario)
            ]
            for tipo_reposicao, dias_validade in tipos_validades:
                    # Usar update_or_create para garantir que exista apenas um registro por tipo
                    ValidadeReposicao.objects.update_or_create(
                        tipo_reposicao=tipo_reposicao,
                        defaults={
                            'dias_validade': dias_validade,
                            'ativo': True
                        }
                    )
            
            for tipo_beneficios, dias_validade in tipos_beneficios_validades:
                    ValidadeBeneficios.objects.update_or_create(
                        tipo_beneficio=tipo_beneficios,
                        defaults={
                            'dias_validade': dias_validade,
                            'ativo': True
                        }
                    )
            messages.success(request, 'Configurações de validade salvas com sucesso!')
                
        elif tipo == 'config_agenda':
            hora_abertura = request.POST.get('hora_abertura')
            hora_fechamento = request.POST.get('hora_fechamento')
            dias_semana = request.POST.getlist('dias_semana[]')
            
            config, created = ConfigAgenda.objects.update_or_create(
                            defaults={
                'horario_abertura': hora_abertura,
                'horario_fechamento': hora_fechamento,
                'dias_funcionamento': dias_semana
            }
            )
            
            messages.success(request, 'Configurações salvas com sucesso!')
        
        
        elif tipo == 'escala_base_profissional':

            prof_id = request.POST.get('profissional_id')
            profissional = Profissional.objects.get(id=prof_id)

            for dia in ['seg','ter','qua','qui','sex','sab','dom']:

                ativo = request.POST.get(f'disp[{dia}][ativo]') == 'on'
                inicio = request.POST.get(f'disp[{dia}][inicio]') or None
                fim = request.POST.get(f'disp[{dia}][fim]') or None

                EscalaBaseProfissional.objects.update_or_create(
                    profissional=profissional,
                    dia_semana=dia,
                    defaults={
                        'ativo': ativo,
                        'hora_inicio': inicio,
                        'hora_fim': fim
                    }
                )

            return JsonResponse({'success': True})

        elif tipo == 'mensagem_padrao':
            titulo = request.POST.get('message_title')
            mensagem = request.POST.get('message_text')

            if not titulo or not mensagem:
                return JsonResponse({'error':'Deu ruim'})

            else:

                MensagemPadrao.objects.create(
                    titulo=titulo,
                    mensagem=mensagem,
                    ativo=True,
                )
            
            messages.success(request,'Nova mensagem salva com sucesso!')
             

        elif tipo == 'doc-empresa':
            tipo_documento = request.POST.get('tipo_documento')
            validade_raw = request.POST.get('validade_yes_no')

            if not tipo_documento or validade_raw not in ['yes', 'no']:
                return JsonResponse({'error': 'Dados inválidos'}, status=400)

            exige_validade = True if validade_raw == 'yes' else False

            TipoDocumentoEmpresa.objects.create(
                tipo_documento=tipo_documento,
                exige_validade=exige_validade,
                ativo=True,
            )

            messages.success(request, 'Documento salvo com sucesso!')


        '''
        =====================================================================================
                                            EDIÇÃO
        =====================================================================================
        '''
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    tipo = request.POST.get('tipo')
                    
                    if tipo == 'editar_especialidade':
                        especialidade_id = request.POST.get('especialidade_id')
                        nome = request.POST.get('nome')
                        cor = request.POST.get('cor')
                        
                        try:
                            especialidade = Especialidade.objects.get(id=especialidade_id)
                            especialidade.nome = nome
                            especialidade.cor = cor
                            especialidade.save()
                            return JsonResponse({'success': True})
                        except Exception as e:
                            return JsonResponse({'success': False, 'error': str(e)})
                                       
                    elif tipo == 'editar_banco':
                        banco_id = request.POST.get('banco_id')
                        tipo_conta_banco = request.POST.get('tipo_conta_banco')
                        codigo_banco = request.POST.get('codigo_banco')
                        nome_banco = request.POST.get('nome_banco')
                        conta_banco = request.POST.get('conta_banco')
                        digito_banco = request.POST.get('digito_banco')
                        chave_pix_banco = request.POST.get('chave_pix_banco')
                        ativo = True
                        try:
                            banco = ContaBancaria.objects.get(id=banco_id)
                            banco.tipo_conta_banco = tipo_conta_banco
                            banco.codigo_banco     = codigo_banco
                            banco.nome_banco       = nome_banco
                            banco.conta_banco      = conta_banco
                            banco.digito_banco     = digito_banco
                            banco.chave_pix_banco  = chave_pix_banco
                            banco.save()
                            
                            return JsonResponse({'success': True})
                        except Exception as e:
                            return JsonResponse({'success': False, 'error': str(e)})
                        
                    elif tipo == 'editar_fornecedor':
                        fornecedor_id = request.POST.get('fornecedor_id')
                        tipo_pessoa = request.POST.get('tipo_pessoa')
                        razao_social = request.POST.get('razao_social')
                        nome_fantasia = request.POST.get('nome_fantasia')
                        documento = request.POST.get('documento')
                        telefone = request.POST.get('telefone')
                        email = request.POST.get('email')
                        conta_codigo = request.POST.get('conta_codigo')  # Adicione esta linha
                        
                        try:
                            fornecedor = Fornecedor.objects.get(id=fornecedor_id)
                            
                            # Processar a conta contábil (mesma lógica do cadastro)
                            conta_contabil = None
                            if conta_codigo and conta_codigo.strip():
                                try:
                                    # Formatar o código
                                    if len(conta_codigo) >= 3:
                                        tipo_codigo = conta_codigo[0]  # R ou D
                                        grupo_codigo = conta_codigo[1]  # primeiro dígito do grupo
                                        subgrupo_codigo = conta_codigo[2:]  # restante para subgrupo
                                        codigo_formatado = f"{tipo_codigo}.{grupo_codigo}.{subgrupo_codigo}"
                                    else:
                                        codigo_formatado = conta_codigo
                                    
                                    # Buscar a conta
                                    conta_contabil = SubgrupoConta.objects.get(
                                        codigo_completo=codigo_formatado,
                                        ativo=True
                                    )
                                except SubgrupoConta.DoesNotExist:
                                    # Tentar buscar sem formatação
                                    try:
                                        conta_contabil = SubgrupoConta.objects.get(
                                            codigo_completo=conta_codigo,
                                            ativo=True
                                        )
                                    except SubgrupoConta.DoesNotExist:
                                        return JsonResponse({
                                            'success': False, 
                                            'message': f'Conta contábil não encontrada: {conta_codigo}'
                                        })
                                except Exception as e:
                                    print(f"Erro ao buscar conta: {e}")
                                    # Continuar sem conta, não quebrar a edição
                            
                            # Atualizar o fornecedor
                            fornecedor.tipo_pessoa = tipo_pessoa
                            fornecedor.razao_social = razao_social
                            fornecedor.nome_fantasia = nome_fantasia
                            fornecedor.documento = documento
                            fornecedor.telefone = telefone
                            fornecedor.email = email
                            
                            # Atualizar a conta contábil (pode ser None)
                            if conta_codigo:
                                fornecedor.conta_contabil = conta_contabil
                            elif conta_codigo == '':
                                # Se foi enviado uma string vazia, limpar a conta
                                fornecedor.conta_contabil = None
                            
                            fornecedor.save()
                            
                            return JsonResponse({'success': True})
                            
                        except Fornecedor.DoesNotExist:
                            return JsonResponse({'success': False, 'error': 'Fornecedor não encontrado'})
                        except Exception as e:
                            return JsonResponse({'success': False, 'error': str(e)})
                
                    elif tipo == 'editar_servico':

                        servico_id = request.POST.get('servico_id')
                        nome = request.POST.get('nome')
                        valor = request.POST.get('valor')
                        qtd_sessoes = request.POST.get('qtd_sessoes')

                        try:
                            servico = Servico.objects.get(id=servico_id)
                            servico.nome = nome
                            servico.valor = valor
                            servico.qtd_sessoes = qtd_sessoes
                            return JsonResponse({'success': True})
                        except Exception as e:
                            return JsonResponse({'success': False, 'error': str(e)})
        '''             
        =====================================================================================
                                            INATIVAÇÃO
        =====================================================================================
        '''
        if tipo:
            # Exemplo: tipo == 'inativar_servico' → ação = 'inativar', modelo_str = 'servico'
            if '_' in tipo:
                acao, modelo_str = tipo.split('_', 1)
                modelo = MODELOS_ATIVAVEIS.get(modelo_str)

                if modelo:
                    if acao == 'inativar':
                        alterar_status_ativo(request, modelo, ativar=False, prefixo=modelo_str)
                    elif acao == 'reativar':
                        alterar_status_ativo(request, modelo, ativar=True, prefixo=modelo_str)
                return redirect('config')
   
    servicos, total_servicos_ativos, mostrar_todos_servico, filtra_inativo_servico = filtrar_ativos_inativos(request, Servico, prefixo='servico')
    especialidades, total_especialidades_ativas, mostrar_todos_especialidade, filtra_inativo_especialidade = filtrar_ativos_inativos(request, Especialidade, prefixo='especialidade')
    fornecedores, total_fornecedores_ativas, mostrar_todos_fornecedores, filtra_inativo_fornecedores = filtrar_ativos_inativos(request, Fornecedor, prefixo='fornecedor')
    from django.db.models import Exists, OuterRef

    try:
        config = ConfigAgenda.objects.first()
    except:
        config = None
    usuarios = User.objects.filter(ativo=True).all().select_related('profissional')
    bancos = ContaBancaria.objects.all()
    profissionais = Profissional.objects.all()
    fornecedores = Fornecedor.objects.all()
    categorias = CategoriaContasReceber.objects.all()
    escala_ativa = EscalaBaseProfissional.objects.filter(
        profissional=OuterRef('pk'),
        ativo=True
    )

    profissionais = profissionais.annotate(
        escala_configurada=Exists(escala_ativa)
    )

    
    print(categorias)
 
    
    
    return render(request, 'core/configuracoes.html', {
        'servicos': servicos,
        'especialidades': especialidades,
        'mostrar_todos_servico': mostrar_todos_servico,
        'filtra_inativo_servico': filtra_inativo_servico,
        'mostrar_todos_especialidade': mostrar_todos_especialidade,
        'filtra_inativo_especialidade': filtra_inativo_especialidade,
        'mostrar_todos_fornecedores':mostrar_todos_fornecedores,
        'filtra_inativo_fornecedores':filtra_inativo_fornecedores,
        'usuarios': usuarios,
        'user_tipo_choices': User._meta.get_field('tipo').choices,
        'bancos':bancos,
        'fornecedores':fornecedores,
        'profissionais':profissionais,
        'categorias':categorias,
        'validades_reposicao': {
            'D': ValidadeReposicao.objects.filter(tipo_reposicao='d').first(),
            'DCR': ValidadeReposicao.objects.filter(tipo_reposicao='dcr').first(),
            'FCR': ValidadeReposicao.objects.filter(tipo_reposicao='fcr').first(),
        },
        'config':config,
         
    })

def obter_escala_profissional(request, prof_id):
    escalas = EscalaBaseProfissional.objects.filter(profissional_id=prof_id)
    data = {}
    
    for escala in escalas:
        data[escala.dia_semana] = {
            'profissional': escala.profissional.nome,
            'ativo': escala.ativo,
            'inicio': escala.hora_inicio.strftime('%H:%M') if escala.hora_inicio else '',
            'fim': escala.hora_fim.strftime('%H:%M') if escala.hora_fim else '',
        }
        
    return JsonResponse(data)
    
def obter_mensagem_padrao(request):
    mensagens =  MensagemPadrao.objects.filter(ativo=True)
    data = []
    
    for mensagem in mensagens:
        data.append({
            'titulo':mensagem.titulo,
            'mensagem': mensagem.mensagem,
            'criado_em': mensagem.criado_em,
        })
        
    return JsonResponse({'mensagens':data})
        
        
def testes(request):
    
    return render(request, 'core/agendamentos/testes.html')
