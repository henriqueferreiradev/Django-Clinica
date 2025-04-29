from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('', views.dashboard_view, name='dashboard'),
    
    path('pacientes/', views.pacientes_view, name='pacientes'),
    path('pacientes/cadastrar', views.cadastrar_pacientes_view, name='cadastrar_paciente'),

    path('profissionais/', views.profissionais_view, name='profissionais'),
    path('profissionais/cadastrar', views.cadastrar_profissionais_view, name='cadastrar_profissional'),

    path('financeiro/', views.financeiro_view, name='financeiro'),
    path('agenda/', views.agenda_view, name='agenda'),
    path('agenda/novo_agendamento', views.novo_agendamento_view, name='novo_agendamento'),

    path('config/', views.configuracao_view, name='config'),
 
]