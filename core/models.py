from django.db import models
from django.contrib.auth.models import AbstractUser

TIPOS_USUARIO = [
    ('admin', 'Administrador'),
    ('profissional', 'Profissional'),
    ('paciente', 'Paciente'),
    
]

FORMAS_PAGAMENTO = [
    ('pix', 'Pix'),
    ('debito', 'Cartão de Débito'),
    ('credito', 'Cartão de Crédito'),
    ('dinheiro', 'Dinheiro'),
]

class User(AbstractUser):
    tipo = models.CharField(max_length=20, choices=TIPOS_USUARIO)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    ativo = models.BooleanField(default=True)
    
    def __str__(self):
        return f'{self.username} ({self.tipo})'
    
class Especialidade(models.Model):
    nome = models.CharField(max_length=100)
    
    def __str__(self):
        return self.nome
    
class Paciente(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, blank=True, null=True)
    nome =  models.CharField(max_length=255)
    cpf = models.CharField(max_length=14, blank=True, null=True)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    #endereco = models.TextField(blank=True, null=True)
    #observacoes = models.TextField(blank=True, null=True)
    #data_cadastro = models.DateField(blank=True, null=True)
    def __str__(self):
        return self.nome
     
    
class Funcionario(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    cargo = models.CharField(max_length=30, choices=[
        ('profissional', 'Profissional'),
        ('recepcionista', 'Recepcionista'),
        ('admin', 'Administrador'),
    ])
    especialidade = models.ForeignKey(Especialidade, on_delete=models.SET_NULL, null=True, blank=True)
    comissao = models.DecimalField(max_digits=5,decimal_places=2, default=0.0)
    horario_trabalho = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.user.get_full_name or self.user.username
    
class Pagamento(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    profissional = models.ForeignKey(Funcionario, on_delete=models.SET_NULL, null=True, blank=True)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    forma_pagamento = models.CharField(max_length=20, choices=FORMAS_PAGAMENTO)
    servico = models.CharField(max_length=100)
    data_pagamento = models.DateTimeField(auto_now_add=True)
    comissao_gerada = models.BooleanField(default=True)
    obs = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f'{self.paciente.nome} - R${self.valor} em {self.data_pagamento.date()}'