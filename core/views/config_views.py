from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from core.models import Fornecedor,Paciente, User,Especialidade,Profissional, ContaBancaria, Servico,PacotePaciente,Agendamento,Pagamento, ESTADO_CIVIL, MIDIA_ESCOLHA, VINCULO, COR_RACA, UF_ESCOLHA,SEXO_ESCOLHA, CONSELHO_ESCOLHA
from core.utils import filtrar_ativos_inativos, alterar_status_ativo, registrar_log
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages

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
            if nome and valor and qtd_sessoes:
                try:
                    valor = float(valor.replace(',', '.'))
                    Servico.objects.create(nome=nome, valor=valor, qtd_sessoes=qtd_sessoes, ativo=True)
                    print('SALVO COM SUCESSO')
                except Exception as e:
                    print("Erro ao salvar serviço:", e)
                    
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
                ContaBancaria.objects.create(codigo_banco=codigo_banco,nome_banco=nome_banco,agencia_banco=agencia_banco,conta_banco=conta_banco,digito_banco=digito_banco,tipo_conta_banco=tipo_conta_banco,chave_pix_banco=chave_pix_banco, ativo=ativo)
            except Exception as e:
                print(e)

 
            
            
        elif tipo == 'cadastro_fornecedores':
            tipo_pessoa = request.POST.get('tipo_pessoa')
            documento_fornecedor = request.POST.get('documento_fornecedor')
            razao_social_fornecedor = request.POST.get('razao_social_fornecedor')
            fantasia_fornecedor = request.POST.get('fantasia_fornecedor')
            telefone_fornecedor = request.POST.get('telefone_fornecedor')
            email_fornecedor = request.POST.get('email_fornecedor')
            ativo = True
            
             
            try:
                Fornecedor.objects.create(tipo_pessoa=tipo_pessoa,razao_social=razao_social_fornecedor,nome_fantasia=fantasia_fornecedor,documento=documento_fornecedor,telefone=telefone_fornecedor,email=email_fornecedor,
                ativo=ativo)
            except Exception as e:
                print(e)
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
                        
                        try:
                            fornecedor = Fornecedor.objects.get(id=fornecedor_id)
                            fornecedor.tipo_pessoa   = tipo_pessoa
                            fornecedor.razao_social  = razao_social
                            fornecedor.nome_fantasia = nome_fantasia
                            fornecedor.documento     = documento
                            fornecedor.telefone      = telefone
                            fornecedor.email         = email
                            fornecedor.save()
                            
                            
                            return JsonResponse({'success': True})
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
    
    usuarios = User.objects.filter(ativo=True).all().select_related('profissional')
    bancos = ContaBancaria.objects.all()
    profissionais = Profissional.objects.all()
  
    fornecedores = Fornecedor.objects.all()
 
    
    
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
      
    })

def testes(request):
    
    return render(request, 'core/agendamentos/testes.html')
