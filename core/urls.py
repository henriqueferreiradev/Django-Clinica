from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('', views.dashboard_view, name='dashboard'),
    path('pacientes/', views.pacientes_view, name='pacientes'),
    path('profissionais/', views.profissionais_view, name='profissionais'),
    path('financeiro/', views.financeiro_view, name='financeiro'),
]