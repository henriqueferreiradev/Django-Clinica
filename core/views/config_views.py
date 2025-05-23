from django.contrib.auth.decorators import login_required
from core.models import Paciente, Especialidade,Profissional, Servico,PacotePaciente,Agendamento,Pagamento, ESTADO_CIVIL, MIDIA_ESCOLHA, VINCULO, COR_RACA, UF_ESCOLHA,SEXO_ESCOLHA, CONSELHO_ESCOLHA
from core.utils import filtrar_ativos_inativos, alterar_status_ativo 
from django.shortcuts import render, redirect, get_object_or_404
@login_required(login_url='login')


def configuracao_view(request):
 
    MODELOS_ATIVAVEIS = {
    'servico': Servico,
    'especialidade': Especialidade,
     
    # adicione mais conforme necessário
}


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
    
    

    return render(request, 'core/configuracoes.html', {
        'servicos': servicos,
        'especialidades': especialidades,
        'mostrar_todos_servico': mostrar_todos_servico,
        'filtra_inativo_servico': filtra_inativo_servico,
        'mostrar_todos_especialidade': mostrar_todos_especialidade,
        'filtra_inativo_especialidade': filtra_inativo_especialidade,
      
    })
