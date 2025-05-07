from django.db import models
from django.contrib.auth.models import AbstractUser
from datetime import date
from django.utils.text import slugify
import os

def caminho_foto_paciente(instance, filename):
    nome = slugify(instance.nome)
    extensao = os.path.splitext(filename)[1]
    return f'imagens/pacientes/{instance.id}_{nome}/foto_perfil{extensao}'

TIPOS_USUARIO = [
    ('admin', 'Administrador'),
    ('secretaria', "Secretaria"),
    ('recepcionista','Recepcionista'),
    ('profissional', 'Profissional'),
    ('paciente', 'Paciente'), # talvez nao use
    
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
    cor_raca = models.CharField(default='Não informado', max_length=20, choices=COR_RACA)
    sexo = models.CharField(default='Não informado',max_length=20, choices=SEXO_ESCOLHA)
    estado_civil = models.CharField(default='Não informado',max_length=20, choices=ESTADO_CIVIL)
    naturalidade = models.CharField(max_length=50 )
    uf = models.CharField(max_length=50, choices=UF_ESCOLHA)
    midia = models.CharField(max_length=30, choices=MIDIA_ESCOLHA)
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
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    especialidade = models.ForeignKey(Especialidade, on_delete=models.SET_NULL, null=True, blank=True)
    comissao = models.DecimalField(max_digits=5,decimal_places=2, default=0.0)
    horario_trabalho = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.user.get_full_name or self.user.username
    
class Pagamento(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    profissional = models.ForeignKey(Profissional, on_delete=models.SET_NULL, null=True, blank=True)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    forma_pagamento = models.CharField(max_length=20, choices=FORMAS_PAGAMENTO)
    servico = models.CharField(max_length=100)
    data_pagamento = models.DateTimeField(auto_now_add=True)
    comissao_gerada = models.BooleanField(default=True)
    obs = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f'{self.paciente.nome} - R${self.valor} em {self.data_pagamento.date()}'