from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import date
from django.utils.text import slugify
import os

import uuid

def caminho_foto_paciente(instance, filename):
    nome = slugify(instance.nome)
    extensao = os.path.splitext(filename)[1]
    return f'imagens/pacientes/{instance.id}_{nome}/foto_perfil{extensao}'


def caminho_foto_profissional(instance, filename):
    nome = slugify(instance.nome)
    extensao = os.path.splitext(filename)[1]
    return f'imagens/profissionais/{instance.id}_{nome}/foto_perfil{extensao}'


TIPOS_USUARIO = [
    ('admin', 'Administrador'),
    ('secretaria', "Secretaria"),
    ('recepcionista','Recepcionista'),
    ('profissional', 'Profissional'),
    ('paciente', 'Paciente'),  
    
]

FORMAS_PAGAMENTO = [
    ('pix', 'Pix'),
    ('debito', 'Cartão de Débito'),
    ('credito', 'Cartão de Crédito'),
    ('dinheiro', 'Dinheiro'),
]

ESTADO_CIVIL = [
    # padrao "Não informado"
    ('solteiro(a)','Solteiro(a)'),
    ('casado(a)','Casado(a)'),
    ('divorciado(a)','Divorciado(a)'),
    ('viuvo(a))','Viúvo(a)'),
    ('uniao estavel','União estável'),
]

COR_RACA = [
    # padrao "Não informado"
    ('branca','Branca'),
    ('preta','Preta'),
    ('parda','Parda'),
    ('amarela','Amarela'),
    ('indígena','Indígena'),
    ('prefiro não informar','Prefiro não informar'),
]
TIPO_FUNCIONARIO = [
    ('funcionario', 'Funcionário'),
    ('sublocatario', 'Sublocatário'),
    ('parceiro', 'Parceiro'),
]
VINCULO = [
    ('pai', 'Pai'),
    ('mae', 'Mãe'),
    ('padrasto', 'Padrasto'),
    ('madrasta', 'Madrasta'),
    ('filho_filha', 'Filho(a)'),
    ('irmao_irma', 'Irmão(ã)'),
    ('avo_avó', 'Avô(ó)'),
    ('neto_neta', 'Neto(a)'),
    ('tio_tia', 'Tio(a)'),
    ('primo_prima', 'Primo(a)'),
    ('sobrinho_sobrinha', 'Sobrinho(a)'),
    ('cunhado_cunhada', 'Cunhado(a)'),
    ('genro_nora', 'Genro/Nora'),
    ('sogro_sogra', 'Sogro(a)'),
    ('marido_esposa', 'Marido/Esposa'),
    ('companheiro_companheira', 'Companheiro(a)'),
    ('namorado_namorada', 'Namorado(a)'),
    ('amigo_amiga', 'Amigo(a)'),
    ('vizinho_vizinha', 'Vizinho(a)'),
    ('colega_trabalho', 'Colega de trabalho'),
    ('outro', 'Outro'),
]

SEXO_ESCOLHA = [
    ('masculino','Masculino'),
    ('feminino','Feminino'),
    ('outro','Outro'),
    ('prefiro não informar','Prefiro não informar'),

]

UF_ESCOLHA = [
    ('AC', 'Acre'),
    ('AL', 'Alagoas'),
    ('AP', 'Amapá'),
    ('AM', 'Amazonas'),
    ('BA', 'Bahia'),
    ('CE', 'Ceará'),
    ('DF', 'Distrito Federal'),
    ('ES', 'Espírito Santo'),
    ('GO', 'Goiás'),
    ('MA', 'Maranhão'),
    ('MT', 'Mato Grosso'),
    ('MS', 'Mato Grosso do Sul'),
    ('MG', 'Minas Gerais'),
    ('PA', 'Pará'),
    ('PB', 'Paraíba'),
    ('PR', 'Paraná'),
    ('PE', 'Pernambuco'),
    ('PI', 'Piauí'),
    ('RJ', 'Rio de Janeiro'),
    ('RN', 'Rio Grande do Norte'),
    ('RS', 'Rio Grande do Sul'),
    ('RO', 'Rondônia'),
    ('RR', 'Roraima'),
    ('SC', 'Santa Catarina'),
    ('SP', 'São Paulo'),
    ('SE', 'Sergipe'),
    ('TO', 'Tocantins'),
]

MIDIA_ESCOLHA = [
    ('indicacao', 'Indicação'),
    ('redes_sociais', 'Redes Sociais (Instagram, Facebook etc.)'),
    ('google_site', 'Google / Site'),
    ('outdoor_panfleto', 'Outdoor / Panfleto'),
    ('evento', 'Evento'),
    ('tv_radio', 'TV / Rádio'),
    ('whatsapp', 'WhatsApp'),
    ('outro', 'Outro'),
] 

CONSELHO_ESCOLHA = [
    ("cref", 'CREF'),
    ("crefito", 'CREFITO'),
    ("cfn", 'CFN'),
    ("crbm", 'CRBM'),
    ("coren", 'COREN'),
    ("cra", 'CRA'),
]

STATUS_CHOICES = [
    ('pre', '✅ Pré-Agendado'),
    ('agendado', '✅ Agendado'),
    ('finalizado', '✅ Consulta finalizada!'),
    ('desmarcacao', '❌ D - Desmarcação'),
    ('dcr', '⚠ DCR: Desmarcação com Reposição'),
    ('fcr', '⚠ FCR: Falta com Reposição'),
    ('falta_cobrada', '❌ FC: Falta Cobrada'),
]
class User(AbstractUser):
    tipo = models.CharField(max_length=20, choices=TIPOS_USUARIO)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    ativo = models.BooleanField(default=True)
    
    def __str__(self):
        return f'{self.username} ({self.tipo})'
    
class Especialidade(models.Model):
    nome = models.CharField(max_length=100)
    cor = models.CharField(max_length=7)
    ativo = models.BooleanField(default=True)
    
    def __str__(self):
        return self.nome

class Paciente(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, blank=True, null=True)
    nome =  models.CharField(max_length=100)
    sobrenome =  models.CharField(max_length=150,blank=True, null=True)
    nomeSocial = models.CharField(default='Não informado', max_length=100, blank=True)
    rg = models.CharField(max_length=12, blank=True, null=True)
    cpf = models.CharField(max_length=14, blank=True, null=True)
    data_nascimento = models.DateField(blank=True, null=True)
    cor_raca = models.CharField(default='Não informado', max_length=20,blank=True, null=True, choices=COR_RACA)
    sexo = models.CharField(default='Não informado',max_length=20, choices=SEXO_ESCOLHA)
    estado_civil = models.CharField(default='Não informado',max_length=20, choices=ESTADO_CIVIL)
    profissao = models.CharField(default='Não informado', max_length=35)  
    naturalidade = models.CharField(max_length=50 )
    uf = models.CharField(max_length=50, choices=UF_ESCOLHA)
    midia = models.CharField(max_length=30, choices=MIDIA_ESCOLHA)
    redeSocial = models.CharField(default='Não informado', max_length=35)       
    foto = models.ImageField(upload_to=caminho_foto_paciente, blank=True, null=True)
    observacao = models.TextField(max_length=5000, blank=True, null=True)
 
    cep = models.CharField(max_length=10, blank=True, null=True)
    rua = models.TextField(max_length=255, blank=True, null=True)
    numero = models.TextField(max_length=10, blank=True, null=True)
    complemento = models.TextField(max_length=100, blank=True, null=True)
    bairro = models.TextField(max_length=100, blank=True, null=True)
    cidade = models.TextField(max_length=100, blank=True, null=True)
    estado = models.TextField(max_length=100, blank=True, null=True)
    
    telefone = models.CharField(max_length=20, blank=True, null=True)
    celular  = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(max_length=255, blank=True, null=True)
    nomeEmergencia = models.CharField(max_length=100)
    vinculo = models.CharField(max_length=100, choices=VINCULO)
    telEmergencia = models.CharField(max_length=20, blank=True, null=True)
     
    data_cadastro = models.DateField(default=date.today, blank=True, null=True)
    ativo = models.BooleanField(default=True)
    def __str__(self):
        return self.nome
     
    
class Profissional(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, blank=True, null=True)
    nome =  models.CharField(max_length=100)
    sobrenome =  models.CharField(max_length=150,blank=True, null=True)
    nomeSocial = models.CharField(default='Não informado', max_length=100, blank=True)
    rg = models.CharField(max_length=12, blank=True, null=True)
    cpf = models.CharField(max_length=14, blank=True, null=True)
    cnpj = models.CharField(max_length=14, blank=True, null=True)
    data_nascimento = models.DateField(blank=True, null=True)
    cor_raca = models.CharField(default='Não informado', max_length=20, choices=COR_RACA)
    sexo = models.CharField(default='Não informado',max_length=20, choices=SEXO_ESCOLHA)
    estado_civil = models.CharField(default='Não informado',max_length=20, choices=ESTADO_CIVIL)
    naturalidade = models.CharField(max_length=50 )
    uf = models.CharField(max_length=50, choices=UF_ESCOLHA)
    especialidade = models.ForeignKey(Especialidade, on_delete=models.SET_NULL, null=True, blank=True)
    conselho1 = models.CharField(max_length=20, choices=CONSELHO_ESCOLHA, blank=True, null=True)
    num1_conselho = models.CharField(max_length=20,  blank=True, null=True)
    conselho2 = models.CharField(max_length=20, choices=CONSELHO_ESCOLHA , blank=True, null=True)
    num2_conselho = models.CharField(max_length=20, blank=True, null=True)    
    conselho3 = models.CharField(max_length=20, choices=CONSELHO_ESCOLHA, blank=True, null=True)
    num3_conselho = models.CharField(max_length=20, blank=True, null=True)
    conselho4 = models.CharField(max_length=20, choices=CONSELHO_ESCOLHA, blank=True, null=True)
    num4_conselho = models.CharField(max_length=20, blank=True, null=True)
    foto = models.ImageField(upload_to=caminho_foto_profissional, blank=True, null=True)
    observacao = models.TextField(max_length=5000, null=True)


    cep = models.CharField(max_length=10, blank=True, null=True)
    rua = models.TextField(max_length=255, blank=True, null=True)
    numero = models.TextField(max_length=10, blank=True, null=True)
    complemento = models.TextField(max_length=100, blank=True, null=True)
    bairro = models.TextField(max_length=100, blank=True, null=True)
    cidade = models.TextField(max_length=100, blank=True, null=True)
    estado = models.TextField(max_length=100, blank=True, null=True)
    
    telefone = models.CharField(max_length=20, blank=True, null=True)
    celular  = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(max_length=255, blank=True, null=True)
    nomeEmergencia = models.CharField(max_length=100)
    vinculo = models.CharField(max_length=100, choices=VINCULO)
    telEmergencia = models.CharField(max_length=20, blank=True, null=True)
     
    data_cadastro = models.DateField(default=date.today, blank=True, null=True)
    ativo = models.BooleanField(default=True)
    
    def __str__(self):
        if self.user:
            return self.user.get_full_name() or self.user.username
        return "Profissional sem usuário"
    
 
    

class Servico(models.Model):
    nome = models.CharField(max_length=100)
    valor = models.DecimalField(max_digits=8, decimal_places=2)
    qtd_sessoes = models.PositiveIntegerField(default=1)
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nome} - R$ {self.valor}" 
    


class PacotePaciente(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    servico = models.ForeignKey(Servico, on_delete=models.SET_NULL, null=True)
    profissional = models.ForeignKey(Profissional, on_delete=models.SET_NULL, null=True)
    codigo = models.CharField(max_length=12, unique=True, editable=False)
    qtd_sessoes = models.PositiveIntegerField()
    valor_original = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    desconto_reais = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    desconto_percentual = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    valor_final = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    valor_total = models.DecimalField(max_digits=8, decimal_places=2)
    data_inicio = models.DateField(default=timezone.now)
    ativo = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.codigo:
            self.codigo = uuid.uuid4().hex[:8].upper()
        if not self.qtd_sessoes:
            self.qtd_sessoes = self.servico.qtd_sessoes
        if not self.valor_total:
            self.valor_total = self.servico.valor
        super().save(*args, **kwargs)

    def get_sessao_atual(self, agendamento=None):
        if agendamento:
            anteriores = self.agendamento_set.filter(
                data__lt=agendamento.data
            ).count()
            return anteriores + 1
        return self.sessoes_realizadas + 1
        
    @property
    def sessoes_realizadas(self):
         return self.agendamento_set.filter(status__in=['agendado', 'finalizado', 'falta_cobrada']).count()

    def sessoes_agendadas(self):
         return self.agendamento_set.filter(status__in=['agendado', 'finalizado', 'falta_cobrada']).count()

    @property
    def sessoes_restantes(self):
        return self.qtd_sessoes - self.sessoes_realizadas

    @property
    def total_pago(self):
        return sum(p.valor for p in self.pagamento_set.all())

    @property
    def valor_restante(self):
        return self.valor_final - self.total_pago

    def __str__(self):
        return f"Pacote {self.codigo} - {self.paciente}"

 

class Agendamento(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    servico = models.ForeignKey(Servico, on_delete=models.SET_NULL, null=True)
    especialidade = models.ForeignKey(Especialidade, on_delete=models.SET_NULL, null=True)
    profissional_1 = models.ForeignKey(Profissional, on_delete=models.SET_NULL, null=True, related_name='principal')
    profissional_2 = models.ForeignKey(Profissional, on_delete=models.SET_NULL, null=True, blank=True, related_name='auxiliar')
    data = models.DateField()
    hora_inicio = models.TimeField()
    hora_fim = models.TimeField()
    ambiente = models.CharField(max_length=100, blank=True)
    observacoes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pre')
    pacote = models.ForeignKey(PacotePaciente, on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"{self.paciente} - {self.data} {self.hora_inicio}"

class Pagamento(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    pacote = models.ForeignKey(PacotePaciente, on_delete=models.SET_NULL, null=True, blank=True)
    agendamento = models.ForeignKey(Agendamento, on_delete=models.SET_NULL, null=True, blank=True)
    valor = models.DecimalField(max_digits=8, decimal_places=2)
    data = models.DateField(default=timezone.now)
    forma_pagamento = models.CharField(max_length=30, choices=[
        ('pix', 'Pix'),
        ('credito', 'Cartão de Crédito'),
        ('debito', 'Cartão de Débito'),
        ('dinheiro', 'Dinheiro'),
    ])
  

    def __str__(self):
        ref = self.pacote.codigo if self.pacote else f"Sessão {self.agendamento.id}" if self.agendamento else "Avulso"
        return f"{self.paciente} - R$ {self.valor} - {ref}"
