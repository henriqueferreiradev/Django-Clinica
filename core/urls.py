from django.urls import path
from core.views import (
 
 
    auth_views,
    agendamento_views,
    config_views,
    dashboard_views,
    financeiro_views,
    pacientes_views,
    profissionais_views,
    logs_views,
    api_views,
    form_builder_views,
    equipamentos_views,
    administrativo_views,
    frequencia_views,
)
 

urlpatterns = [
    
    
    path('api/verificar_beneficios_mes/<int:paciente_id>', agendamento_views.verificar_beneficios_mes, name='verificar_beneficios_mes'),
    path('api/beneficios/usar',agendamento_views.usar_beneficio,name='usar_beneficio'),
    path('api/agendamentos/', agendamento_views.criar_agendamento, name='criar_agendamento'),
    path('api/verificar_pacotes_ativos/<int:paciente_id>/', agendamento_views.verificar_pacotes_ativos, name='verificar_pacotes_ativos'),
    path('api/verificar-cpf/', api_views.verificar_cpf, name='verificar_cpf'),
    path('api/registrar_recebimento/<int:pagamento_id>/', api_views.registrar_recebimento, name='registrar_recebimento'),
    path('api/lista_status/<int:paciente_id>', pacientes_views.lista_status, name='lista_status'),

    path('api/salvar-prontuario/', api_views.salvar_prontuario, name='salvar_prontuario'),
    path('api/listar-prontuarios/<int:paciente_id>/', api_views.listar_prontuarios, name='listar_prontuarios'),
    path('api/detalhe-prontuarios/<int:agendamento_id>/', api_views.detalhes_prontuario, name='detalhe_prontuarios'),
    path('api/detalhe-evolucoes/<int:agendamento_id>/', api_views.detalhes_evolucao, name='detalhe_prontuarios'),
    
    path('api/verificar-prontuario/<int:agendamento_id>/', api_views.verificar_prontuario, name='verificar_prontuario' ),
    
    
    
    path('api/salvar-evolucao/', api_views.salvar_evolucao, name='salvar_evolucao'),
    path('api/listar-evolucoes/<int:paciente_id>/', api_views.listar_evolucoes, name='listar_evolucoes'),
    
    path('api/salvar-avaliacao/', api_views.salvar_avaliacao, name='salvar_avaliacao'),
    path('api/listar-avaliacoes/<int:paciente_id>/', api_views.listar_avaliacoes, name='listar_avaliacoes'),
    
    path('api/salvar-imagem/', api_views.salvar_imagem, name='salvar_imagem'),
    path('api/listar-imagens/<int:paciente_id>/', api_views.listar_imagens, name='listar_imagens'),
    path('api/criar-pasta/', api_views.criar_pasta_imagem, name='criar_pasta_imagem'),
    
    
    path('login/', auth_views.login_view, name='login'),
    path('logout/', auth_views.logout_view, name='logout'), 
    
    
    path('', dashboard_views.dashboard_view, name='dashboard'),
    path('dashboard/alterar_status/<int:pk>',dashboard_views.alterar_status_dashboard, name='alterar_status_dashboard'),


    path('pacientes/', pacientes_views.pacientes_view, name='pacientes'),
    path('pacientes/cadastrar', pacientes_views.cadastrar_pacientes_view, name='cadastrar_paciente'),
    path('pacientes/status_mensal', pacientes_views.paciente_status, name='status_pacientes'),
    path('pacientes/editar/<int:id>/', pacientes_views.editar_paciente_view, name='editar_paciente'),
    path('paciente/<int:id>/ficha/', pacientes_views.ficha_paciente, name='ficha_paciente'),
    path('api/paciente/<int:paciente_id>/', pacientes_views.dados_paciente, name='dados_paciente'),
    path('paciente/perfil/<int:paciente_id>/', pacientes_views.perfil_paciente, name='perfil_paciente'),
    #path('paciente/perfil/<int:paciente_id>/todos_agendamentos', pacientes_views.todos_agendamentos, name='todos_agendamentos_paciente'),
    path("api/buscar-pacientes/", pacientes_views.buscar_pacientes, name="buscar_pacientes"),
    path('pacientes/pre_cadastro/', pacientes_views.pre_cadastro, name='pre_cadastro'),
    path('pacientes/link/', pacientes_views.gerar_link_publico_precadastro, name='gerar_link_publico_precadastro'),
    path('pacientes/link/<str:token>/', pacientes_views.pre_cadastro_tokenizado, name='pre_cadastro_token'),

    path('testes/', config_views.testes, name='testes' ),
    
    path('profissionais/', profissionais_views.profissionais_view, name='profissionais'),
    path('profissionais/cadastrar', profissionais_views.cadastrar_profissionais_view, name='cadastrar_profissional'),
    path('profissionais/editar/<int:id>/', profissionais_views.editar_profissional_view, name='editar_profissional'),
    path('profissional/<int:id>/ficha/', profissionais_views.ficha_profissional, name='ficha_profissional'),
    path('api/profissional/<int:profissional_id>/', profissionais_views.dados_profissional, name='dados_profissional'),
    path('profissional/perfil/<int:profissional_id>/', profissionais_views.perfil_profissional, name='perfil_profissional'),
    
    
    path('financeiro/dashboard', financeiro_views.financeiro_view, name='financeiro_dashboard'),
    path('financeiro/fluxo-caixa', financeiro_views.fluxo_caixa_view, name='fluxo_caixa'),
    path('financeiro/entradas', financeiro_views.contas_a_receber_view, name='entradas'),
    path('financeiro/saidas', financeiro_views.contas_a_pagar_view, name='saidas'),
    path('financeiro/faturamento', financeiro_views.faturamento_view, name='faturamento'),
    path('financeiro/folha-pagamento', financeiro_views.folha_pagamento_view, name='folha_pagamento'),
    path('financeiro/relatorios', financeiro_views.relatorios_view, name='financeiro_relatorios'),


    
    path('agenda/', agendamento_views.agenda_view, name='agenda'),
    path('agenda_profissional/', profissionais_views.agenda_profissional, name='agenda_profissional'),
    path('agenda/board', agendamento_views.agenda_board, name='agenda_board'),

    path('agendamento/confirmacao/<int:agendamento_id>/', agendamento_views.confirmacao_agendamento, name='confirmacao_agendamento'),
    path('enviar-email/<int:agendamento_id>/',agendamento_views.enviar_email_agendamento, name='enviar_email_agendamento'),
    path('agendamento/alterar_status/<int:pk>',agendamento_views.alterar_status_agenda, name='alterar_status_agendamento'),
    path('agendamento/json/<int:agendamento_id>/', agendamento_views.pegar_agendamento, name='get_agendamento'),
    path('agendamento/editar/<int:agendamento_id>/', agendamento_views.editar_agendamento, name='editar_agendamento'),
    path('agendamento/<int:pk>/remarcar/', agendamento_views.remarcar_agendamento, name='remarcar_agendamento'),
    

    path('config/', config_views.configuracao_view, name='config'),
    
    path('auditoria/', logs_views.logs_view, name='auditoria_logs'),
    
    
    path('respostas/<int:resposta_id>/', pacientes_views.visualizar_respostas_formulario, name='visualizar_respostas'),
    
    path('formularios/', form_builder_views.form_builder, name='formularios'),
    path('formularios/form/novo/', form_builder_views.novo_formulario, name='novo_formulario'),
    path('formularios/form/inativar/<int:form_id>/', form_builder_views.inativar_formulario, name='inativar_formulario'),
    path('form-builder/listar/', form_builder_views.listar_formularios, name='listar_formularios'),
    path('formularios/form/editar/<int:form_id>/', form_builder_views.editar_formulario, name='editar_formulario'),
    path('form-builder/visualizar/<int:id>/', form_builder_views.visualizar_formulario, name='visualizar_formulario'),
    path('<slug:slug>/<str:token>/', form_builder_views.responder_formulario_token, name='responder_formulario_token'),
    path('paciente/formularios/<int:paciente_id>/',  form_builder_views.formularios_para_paciente,name='formularios_paciente'),
    path('form-builder/obter/<int:form_id>/', form_builder_views.obter_formulario, name='obter_formulario'),
    
 
 
    path('politica-de-privacidade/', pacientes_views.politica_privacidade, name='politica-de-privacidade'),
    path('gestao-equipamentos/', equipamentos_views.gestao_equipamentos, name='politica-de-privacidade'),
 
 
 
    path('dashboard-adm/', administrativo_views.dashboard, name="dashboard_adm"),
    
    path("frequencias", frequencia_views.frequencias_get, name="frequencias_get"),
    path("frequencias/salvar", frequencia_views.frequencias_post, name="frequencias_post"),
      

]