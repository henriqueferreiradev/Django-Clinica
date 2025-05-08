from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('', views.dashboard_view, name='dashboard'),
    
    path('pacientes/', views.pacientes_view, name='pacientes'),
    path('pacientes/cadastrar', views.cadastrar_pacientes_view, name='cadastrar_paciente'),
    path('pacientes/editar/<int:id>/', views.editar_paciente_view, name='editar_paciente'),
    path('paciente/<int:id>/ficha/', views.ficha_paciente, name='ficha_paciente'),

    path('profissionais/', views.profissionais_view, name='profissionais'),
    path('profissionais/cadastrar', views.cadastrar_profissionais_view, name='cadastrar_profissional'),
    path('profissionais/editar/<int:id>/', views.editar_profissional_view, name='editar_profissional'),
    path('profissional/<int:id>/ficha/', views.ficha_profissional, name='ficha_profissional'),
 
    path('financeiro/', views.financeiro_view, name='financeiro'),
    path('agenda/', views.agenda_view, name='agenda'),
    path('agenda/novo_agendamento', views.novo_agendamento_view, name='novo_agendamento'),

    path('config/', views.configuracao_view, name='config'),
   path('api/paciente/<int:paciente_id>/', views.dados_paciente, name='dados_paciente'),
 
 
]