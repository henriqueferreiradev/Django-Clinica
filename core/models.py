from decimal import Decimal
from urllib.parse import DefragResult
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.urls import reverse
from django.utils import timezone
from datetime import date
from django.utils.text import slugify
import os
from dateutil.relativedelta import relativedelta
import uuid
from django.db.models import Q
from django.forms import CharField
from core.services.status_beneficios import calcular_beneficio
from django.db.models import Sum
from django.core.validators import MaxValueValidator, MinValueValidator
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
    ('secretaria', 'Secretaria'),
    ('recepcionista', 'Recepcionista'),
    ('profissional', 'Profissional'),
    ('gerente', 'Gerente'),
    ('financeiro', 'Financeiro'),
    ('coordenador', 'Coordenador Clínico'),
    ('supervisor', 'Supervisor'),
    ('estagiario', 'Estagiário'),
    ('suporte', 'Suporte Técnico'),
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
TIPO_REPOSICAO_CHOICES = [
    ('d', 'Reposição D'),
    ('dcr', 'Reposição DCR'),
    ('fcr', 'Reposição FCR'),
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
    ('desistencia', '❌ D - Desmarcação'),
    ('desistencia_remarcacao', '⚠️ DCR - Desmarcação com reposição'),
    ('falta_remarcacao', '⚠️ FCR - Falta com reposição'),
    ('falta_cobrada', '❌ FC - Falta cobrada'),
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
    
    consentimento_lgpd = models.BooleanField(default=False)
    consentimento_marketing = models.BooleanField(default=False)
    
    politica_privacidade_versao = models.CharField(max_length=32, blank=True, default='')
    data_consentimento = models.DateField(null=True, blank=True)
    ip_consentimento = models.GenericIPAddressField(null=True, blank=True)
    
    nf_reembolso_plano = models.BooleanField(default=False)
    nf_imposto_renda = models.BooleanField(default=False)
    nf_nao_aplica = models.BooleanField(default=False)
    
    data_cadastro = models.DateField(default=date.today, blank=True, null=True)

    ativo = models.BooleanField(default=True)
    pre_cadastro = models.BooleanField(default=False)
    conferido = models.BooleanField(default=False)
    
    def __str__(self):
        return self.nome
    def get_status_mes(self, mes=None, ano=None):
        from datetime import date

        if not mes or not ano:
            hoje = date.today()
            mes, ano = hoje.month, hoje.year

        # tenta pegar do mês atual
        fm = self.frequencias.filter(mes=mes, ano=ano).order_by('-id').first()

        # se não tiver do mês, pega o último registrado
        if not fm:
            fm = self.frequencias.order_by('-ano', '-mes', '-id').first()

        if fm:
            return fm.status

        # fallback
        elif self.data_cadastro and self.data_cadastro.month == mes and self.data_cadastro.year == ano:
            return "primeiro_mes"

        return "Indefinido"

    @property
    def status_atual(self):
        hoje = date.today()
        fm = self.frequencias.filter(mes=hoje.month, ano=hoje.year).first()
        if fm:
            return fm.status
        if self.data_cadastro and self.data_cadastro.month == hoje.month and self.data_cadastro.year == hoje.year:
            return "primeiro_mes"
        return "indefinido"
 

    @property
    def idade_formatada(self):
        if self.data_nascimento:
            hoje = date.today()
            idade = relativedelta(hoje, self.data_nascimento)
            return f'{idade.years} anos, {idade.months} meses e {idade.days} dias'
        return 'Data de nascimento não informada'
    @property
    def endereco_formatado(self):
        return f'{self.rua}, {self.numero}, {self.complemento} - {self.bairro}, {self.cidade}/{self.uf} - {self.cep}'

     
    
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
    redeSocial = models.CharField(default='Não informado', max_length=35)   

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
    
    valor_hora = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    data_cadastro = models.DateField(default=date.today, blank=True, null=True)
    ativo = models.BooleanField(default=True)
    
    @property
    def idade_formatada(self):
        if self.data_nascimento:
            hoje = date.today()
            idade = relativedelta(hoje, self.data_nascimento)
            return f'{idade.years} anos, {idade.months} meses e {idade.days} dias'
        return 'Data de nascimento não informada'
    @property
    def endereco_formatado(self):
        return f'{self.rua}, {self.numero}, {self.complemento} - {self.bairro}, {self.cidade}/{self.uf} - {self.cep}'
    def save(self, *args, **kwargs):
        criando = self.pk is None
        
        super().save(*args, **kwargs)
        
        if criando and not self.user and self.email:
            
            username = self.email
            senha_padrao = self.data_nascimento
            nome = self.nome or ''
            sobrenome = self.sobrenome or ''
            
            if not User.objects.filter(username=username).exists():
                user = User.objects.create(
                username=username,
                email=self.email,
                first_name=nome,
                last_name=sobrenome,
                password=make_password(senha_padrao),
                tipo='profissional',
                ativo = True
                )
                self.user = user
                super().save(update_fields=['user'])
        
        
        
        
        
        
        
            
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
    valor_total = models.DecimalField(max_digits=8, decimal_places=2,default=0)
    tipo_reposicao = models.CharField(max_length=3, choices=TIPO_REPOSICAO_CHOICES, blank=True, null=True, help_text='Tipo de reposição, se for um pacote de reposição')
    data_inicio = models.DateField(default=timezone.now)
    ativo = models.BooleanField(default=True)
    eh_reposicao = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.codigo:
            self.codigo = f'PAC{uuid.uuid4().hex[:8].upper()}'
        if not self.qtd_sessoes:
            self.qtd_sessoes = self.servico.qtd_sessoes
 
        if self.valor_final is None:
            self.valor_final = self.servico.valor 
        super().save(*args, **kwargs)
        
    def get_sessao_atual(self, agendamento=None):
        if agendamento:
            agendamentos = self.agendamento_set.filter(
                status__in=[
                    'agendado',
                    'finalizado',
                    'desistencia_remarcacao',
                    'falta_remarcacao',
                    'falta_cobrada',
                ]
            ).order_by('data', 'hora_inicio', 'id')

            sessao = 1
            for ag in agendamentos:
                if ag.id == agendamento.id:
                    break
                sessao += 1
            return min(sessao, self.qtd_sessoes)  # nunca passa do limite
        return min(self.sessoes_realizadas + 1, self.qtd_sessoes)

        
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
        valor_final = Decimal(str(self.valor_final or 0))
        total_pago = Decimal(str(self.total_pago or 0))
        return valor_final - total_pago


    @property
    def valor_desconto(self):
        if self.desconto_reais:
            return round(self.desconto_reais, 2)
        elif self.desconto_percentual:
            return (self.valor_original or 0) * (self.desconto_percentual / 100)
        return 0
    
    def __str__(self):
        return f"Pacote {self.codigo} Valor restante {self.valor_restante} - {self.paciente} "

 

class Agendamento(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    servico = models.ForeignKey(Servico, null=True, blank=True, on_delete=models.SET_NULL)
    especialidade = models.ForeignKey(Especialidade, on_delete=models.SET_NULL, null=True)
    profissional_1 = models.ForeignKey(Profissional, on_delete=models.SET_NULL, null=True, related_name='principal')
    profissional_2 = models.ForeignKey(Profissional, on_delete=models.SET_NULL, null=True, blank=True, related_name='auxiliar')
    data = models.DateField()
    hora_inicio = models.TimeField()
    hora_fim = models.TimeField()
    hora_inicio_aux = models.TimeField(null=True, blank=True)
    hora_fim_aux = models.TimeField(null=True, blank=True)
    ambiente = models.CharField(max_length=100, blank=True)
    observacoes = models.TextField(blank=True)
    observacao_autor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,related_name='observacoes')
    observacao_data = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='agendado')
    pacote = models.ForeignKey(PacotePaciente, on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.CharField(max_length=200, blank=True)
    foi_reposto = models.BooleanField(default=False)
    def __str__(self):
        return f"{self.paciente} - {self.data} {self.hora_inicio}"

class Pagamento(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    pacote = models.ForeignKey(PacotePaciente, on_delete=models.SET_NULL, null=True, blank=True)
    agendamento = models.ForeignKey(Agendamento, on_delete=models.SET_NULL, null=True, blank=True)
    valor = models.DecimalField(max_digits=8, decimal_places=2)
    data = models.DateTimeField(default=timezone.now)
    receita = models.ForeignKey('Receita', null=True, blank=True,
                                on_delete=models.SET_NULL, related_name='pagamentos')
    forma_pagamento = models.CharField(
        max_length=30,
        choices=[('pix','Pix'),('credito','Cartão de Crédito'),('debito','Cartão de Débito'),('dinheiro','Dinheiro')],
        null=True, blank=True
    )
    status = models.CharField(
        max_length=20,
        choices=[('pendente','Pendente'),('pago','Pago'),('cancelado','Cancelado')],
        default='pendente'
    )
    vencimento = models.DateField(null=True, blank=True)

    def __str__(self):
        ref = self.pacote.codigo if self.pacote else f"Sessão {self.agendamento.id}" if self.agendamento else "Avulso"
        return f"{self.paciente} - R$ {self.valor} - {ref} - {self.data.strftime('%d/%m/%Y')}"


class LogAcao(models.Model):
    usuario = models.ForeignKey('User',on_delete=models.SET_NULL, null=True)
    acao = models.CharField(max_length=50)
    modelo  = models.CharField(max_length=100)
    objeto_id = models.CharField(max_length=50)
    descricao = models.TextField(blank=True)
    data_hora = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.acao} em {self.modelo} (ID {self.objeto_id}) por {self.usuario}"

class Pendencia(models.Model):
    tipo = models.CharField(max_length=100)
    descricao = models.TextField()
    vinculado_paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    resolvido = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)
    responsavel = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    
    
    
    
    
    
    
    
    
    
    








 

TIPO_PERGUNTA = (
    ('short-text', 'Texto Curto'),
    ('paragraph', 'Parágrafo'),
    ('multiple-choice', 'Múltipla Escolha'),
    ('checkbox', 'Checkbox'),
    ('dropdown', 'Dropdown'),
)

from django.db import models
from django.utils.text import slugify

class Formulario(models.Model):
    titulo = models.CharField(max_length=255)
    descricao = models.TextField()
    criado_em = models.DateTimeField(auto_now_add=True)
    slug = models.SlugField(unique=True, blank=True, null=True)
    ativo = models.BooleanField(default=True) 
    
    def save(self, *args, **kwargs):
        if not self.slug:

            base_slug = slugify(self.titulo)
            slug = base_slug
            counter = 2

            while Formulario.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            self.slug = slug

        super().save(*args, **kwargs)

    def __str__(self):
        return self.titulo


class Pergunta(models.Model):
    formulario = models.ForeignKey(Formulario, on_delete=models.CASCADE, related_name='perguntas')
    texto = models.CharField(max_length=500)
    tipo = models.CharField(max_length=20, choices=TIPO_PERGUNTA)
    obrigatoria = models.BooleanField(default=False)

    def __str__(self):
        return self.texto


class OpcaoResposta(models.Model):
    pergunta = models.ForeignKey(Pergunta, on_delete=models.CASCADE, related_name='opcoes')
    texto = models.CharField(max_length=255)

    def __str__(self):
        return self.texto



class LinkFormularioPaciente(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    formulario = models.ForeignKey(Formulario, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.formulario.titulo} - {self.paciente.nome}"

    def get_url(self):
        return reverse('responder_formulario_token', kwargs={
            'slug': self.formulario.slug,
            'token': self.token
        })

class RespostaFormulario(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    formulario = models.ForeignKey(Formulario, on_delete=models.CASCADE)
    enviado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Resposta de {self.paciente.nome} em {self.formulario.titulo}"


import uuid

class Resposta(models.Model):
    formulario = models.ForeignKey('Formulario', on_delete=models.CASCADE)
    paciente = models.ForeignKey('Paciente', on_delete=models.CASCADE)
    token = models.CharField(max_length=32, unique=True, editable=False)
    data_resposta = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = uuid.uuid4().hex[:10]
        super().save(*args, **kwargs)

    def get_resposta_url(self):
        return reverse('responder_formulario_token', kwargs={
            'slug': self.formulario.slug,
            'token': self.token
        })

class RespostaPergunta(models.Model):
    resposta = models.ForeignKey(RespostaFormulario, on_delete=models.CASCADE, related_name='respostas')
    pergunta = models.ForeignKey(Pergunta, on_delete=models.CASCADE)
    valor = models.TextField()

    def __str__(self):
        return f"{self.pergunta.texto[:40]}...: {self.valor[:40]}"




STATUS_PACIENTES_CHOICES = [
    ('primeiro_mes', '1º Mês'),
    ('premium', 'Premium'),
    ('vip', 'VIP'),
    ('plus', 'Plus'),
    ('indefinido', 'Indefinido'),
]

class FrequenciaMensal(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE, related_name='frequencias')
    mes = models.PositiveIntegerField()
    ano = models.PositiveIntegerField()

    freq_sistema = models.PositiveIntegerField(default=0)

    freq_programada = models.PositiveIntegerField(default=0)
    
    programada_set_por = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='freq_programada_por')
    programada_set_em = models.DateTimeField(null=True, blank=True)

    percentual = models.DecimalField(max_digits=6, decimal_places=2,default=0)
    status = models.CharField(max_length=20, choices=STATUS_PACIENTES_CHOICES, default='indefinido')

    observacao = models.TextField(blank=True, null=True)
    fechado = models.BooleanField(default=False)

    class Meta:
        unique_together = ('paciente', 'mes', 'ano')
        indexes = [
            models.Index(fields=['ano', 'mes']),
            models.Index(fields=['paciente', 'ano', 'mes'])
        ]

    def calcular_status(self):
        # 1 mes
        if self.paciente.data_cadastro and self.paciente.data_cadastro.year == self.ano and self.paciente.data_cadastro.month == self.mes:
            return 'primeiro_mes'
        
        if self.freq_programada > 0:
            perc = (self.freq_sistema / self.freq_programada) *100

            if perc >= 100:
                return 'premium'
            elif perc > 60:
                return 'vip'
            return 'plus'
        return 'indefinido'
    def atualizar_percentual_e_status(self):
            self.percentual = round((self.freq_sistema / self.freq_programada) * 100, 2) if self.freq_programada > 0 else 0
            self.status = self.calcular_status()

    def save(self, *args, **kwargs):
        self.atualizar_percentual_e_status()
        super().save(*args, **kwargs)
        
        ganhou = calcular_beneficio(self.paciente, self.mes, self.ano, self.status)
        HistoricoStatus.objects.update_or_create(
            paciente=self.paciente, mes=self.mes, ano=self.ano,
            defaults={
                'status': self.status,
                'percentual': self.percentual,
                'freq_sistema': self.freq_sistema,
                'freq_programada': self.freq_programada,
                'ganhou_beneficio': ganhou,
            }
        )


    def __str__(self):
        return f"{self.paciente.nome} - {self.mes:02d}/{self.ano} - {self.status} ({self.freq_sistema}/{self.freq_programada})"

class HistoricoStatus(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE, related_name="historico_status")
    mes = models.PositiveIntegerField()
    ano = models.PositiveIntegerField()
    status = models.CharField(max_length=50, choices=STATUS_PACIENTES_CHOICES)
    percentual = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    freq_sistema = models.PositiveIntegerField(default=0)
    freq_programada = models.PositiveIntegerField(default=0)

    ganhou_beneficio = models.BooleanField(default=False)  # se ganhou no mês
    data_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('paciente', 'mes', 'ano')
        ordering = ["ano", "mes"]

    def __str__(self):
        return f"{self.paciente.nome} - {self.mes:02d}/{self.ano} - {self.status}"

# core/models.py
BENEFICIO_TIPO = [
    ('relaxante', 'Sessão Relaxante'),     # VIP
    ('desconto', 'Desconto em Pagamento'), # VIP/PREMIUM
    ('brinde', 'Brinde'),                  # VIP/PREMIUM
    ('sessao_livre', 'Sessão Livre'),      # PREMIUM
]

class UsoBeneficio(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE, related_name='usos_beneficio')
    mes = models.PositiveIntegerField()
    ano = models.PositiveIntegerField()
    status_no_mes = models.CharField(max_length=20, choices=STATUS_PACIENTES_CHOICES)
    tipo = models.CharField(max_length=20, choices=BENEFICIO_TIPO)

    agendamento = models.ForeignKey(Agendamento, null=True, blank=True, on_delete=models.SET_NULL)
    valor_desconto_aplicado = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    usado_em = models.DateTimeField(auto_now_add=True)
    usado_por = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        unique_together = ('paciente', 'mes', 'ano', 'tipo')
        indexes = [models.Index(fields=['paciente', 'ano', 'mes', 'tipo'])]











#======================================================================================
#===================================FINANCEIRO=================================
#======================================================================================

class Fornecedor(models.Model):
    tipo_pessoa = models.CharField(max_length=20, blank=True,null=True)
    razao_social = models.CharField(max_length=150)
    nome_fantasia = models.CharField(max_length=150)
    documento = models.CharField(max_length=20, blank=True,null=True)
    telefone = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(blank=True,null=True)
    ativo = models.BooleanField(default=False)
    def __str__(self):
        return self.razao_social
    
    
class CategoriaFinanceira(models.Model):
    TIPO_CHOICES = (
        ('receita',"Receita"),
        ('despesa',"Despesa"),
    )
    
    nome = models.CharField(max_length=100)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)

    def __str__(self):
        return f'{self.nome} ({self.tipo})'

class CategoriaDespesa(models.Model):
    nome = models.CharField(max_length=100)


    def __str__(self):
        return self.nome

class ContaBancaria(models.Model):
    codigo_banco = models.CharField(max_length=10)
    nome_banco = models.CharField(max_length=100)
    agencia_banco = models.CharField(max_length=10)
    conta_banco = models.CharField(max_length=20)
    digito_banco = models.CharField(max_length=20)
    chave_pix_banco = models.CharField(max_length=150)
    tipo_conta_banco = models.CharField(max_length=20, choices=(('corrente', 'Corrente'), ('poupanca', 'Poupança')))
    ativo = models.BooleanField(default=False)
    @property
    def tipo_sigla(self) -> str:
        return "C/C" if self.tipo_conta_banco == "corrente" else "C/P"

    def conta_bancaria_extenso(self):
        base = f'{self.codigo_banco} - {self.nome_banco} - Agência {self.agencia_banco} / Conta {self.conta_banco}-{self.digito_banco} {self.tipo_sigla}'
        return base
    
    def __str__(self):
        return f"{self.nome_banco} - CC {self.agencia_banco}"


class Despesa(models.Model):
    STATUS_CHOICES = (
        ('pendente', 'Pendente'),
        ('agendado', 'Agendado'),
        ('pago', 'Pago'),
        ('atrasado', 'Atrasado'),
    )
    fornecedor = models.ForeignKey(Fornecedor, on_delete=models.SET_NULL, null=True)
    categoria = models.ForeignKey(CategoriaFinanceira, on_delete=models.SET_NULL, null=True, limit_choices_to={'tipo': 'despesa'})
    descricao = models.CharField(max_length=255)
    vencimento = models.DateField()
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente')
    forma_pagamento = models.CharField(max_length=30, blank=True, null=True)
    conta_bancaria = models.ForeignKey(ContaBancaria, on_delete=models.SET_NULL, null=True, blank=True)
    documento = models.CharField(max_length=50, blank=True, null=True)
    observacoes = models.TextField(blank=True, null=True)
    comprovante = models.FileField(upload_to="comprovantes/despesas/", blank=True, null=True)
    recorrente = models.BooleanField(default=False)
    frequencia = models.CharField(max_length=20, blank=True, null=True)
    inicio = models.DateField(blank=True, null=True)
    termino = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.fornecedor} - {self.descricao} ({self.valor})"


class Receita(models.Model):
    STATUS_CHOICES = (
        ('pendente', 'Pendente'),
        ('pago', 'Pago'),
        ('atrasado', 'Atrasado'),
    )
    paciente = models.ForeignKey("core.Paciente", on_delete=models.SET_NULL, null=True, blank=True)  
    categoria = models.ForeignKey(CategoriaFinanceira, on_delete=models.SET_NULL, null=True, limit_choices_to={'tipo': 'receita'})
    descricao = models.CharField(max_length=255)
    agendamento_codigo = models.CharField(max_length=50, blank=True, null=True)
    vencimento = models.DateField()
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente')
    forma_pagamento = models.CharField(max_length=30, blank=True, null=True)
    observacoes = models.TextField(blank=True, null=True)
    recibo = models.FileField(upload_to="recibos/receitas/", blank=True, null=True)
    @property
    def total_pago(self):
        return self.pagamentos.aggregate(s=Sum('valor'))['s'] or 0

 

    @property
    def saldo(self):
        valor = Decimal(str(self.valor or 0))
        pago = Decimal(str(self.total_pago or 0))
        return valor - pago


    def atualizar_status_por_pagamentos(self):
        if self.saldo <= 0:
            self.status = 'pago'
        else:
            self.status = 'atrasado' if (self.vencimento and self.vencimento < date.today()) else 'pendente'
        self.save(update_fields=['status'])
    def __str__(self):
        return f"{self.paciente} - {self.descricao} ({self.valor})"


class Lancamento(models.Model):
    TIPO_CHOICES = (
        ('receita', 'Receita'),
        ('despesa', 'Despesa'),
    )
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    data = models.DateTimeField()
    descricao = models.CharField(max_length=255)
    categoria = models.ForeignKey(CategoriaFinanceira, on_delete=models.SET_NULL, null=True)
    pessoa = models.CharField(max_length=150, blank=True, null=True)  # paciente ou fornecedor
    forma_pagamento = models.CharField(max_length=30)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=(('pago', 'Pago'), ('pendente', 'Pendente')), default='pendente')
    observacoes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.tipo} - {self.descricao} - {self.valor}"



class Prontuario(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    pacote = models.ForeignKey(PacotePaciente, on_delete=models.SET_NULL, null=True, blank=True)
    agendamento = models.OneToOneField(Agendamento, on_delete=models.SET_NULL, null=True, blank=True)
    profissional = models.ForeignKey(Profissional, on_delete=models.CASCADE)
    data_criacao = models.DateTimeField(auto_now_add=True)

    queixa_principal = models.TextField()
    conduta = models.TextField()
    feedback_paciente = models.TextField()
    evolucao = models.TextField()
    diagnostico = models.TextField()
    observacoes = models.TextField()

    nao_se_aplica = models.BooleanField(default=False)
    foi_preenchido = models.BooleanField(default=False)
    class Meta:
        ordering = ['-data_criacao']

    def __str__(self):
        return f'Prontuário {self.paciente} - {self.data_criacao}'
    
class Evolucao(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    pacote = models.ForeignKey(PacotePaciente, on_delete=models.SET_NULL, null=True, blank=True)
    agendamento = models.OneToOneField(Agendamento, on_delete=models.SET_NULL, null=True, blank=True)
    profissional = models.ForeignKey(Profissional, on_delete=models.CASCADE)
    data_criacao = models.DateTimeField(auto_now_add=True)
    foi_preenchido = models.BooleanField(default=False)
    nao_se_aplica = models.BooleanField(default=False)
    # Campos de texto/char opcionais -> blank=True, null=True
    queixa_principal_inicial = models.TextField(blank=True, null=True)
    processo_terapeutico = models.TextField(blank=True, null=True)
    condutas_tecnicas = models.TextField(blank=True, null=True)
    resposta_paciente  = models.TextField(blank=True, null=True)
    intercorrencias = models.TextField(blank=True, null=True)

    dor_inicio = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        null=True, blank=True
    )
    dor_atual = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        null=True, blank=True
    )
    dor_observacoes = models.TextField(blank=True, null=True)

    amplitude_inicio = models.CharField(max_length=100, blank=True, null=True)
    amplitude_atual = models.CharField(max_length=100, blank=True, null=True)
    amplitude_observacoes = models.TextField(blank=True, null=True)

    forca_inicio = models.CharField(max_length=100, blank=True, null=True)
    forca_atual = models.CharField(max_length=100, blank=True, null=True)
    forca_observacoes = models.TextField(blank=True, null=True)

    postura_inicio = models.CharField(max_length=100, blank=True, null=True)
    postura_atual = models.CharField(max_length=100, blank=True, null=True)
    postura_observacoes = models.TextField(blank=True, null=True)

    edema_inicio = models.CharField(max_length=100, blank=True, null=True)
    edema_atual = models.CharField(max_length=100, blank=True, null=True)
    edema_observacoes = models.TextField(blank=True, null=True)

    avds_inicio = models.CharField(max_length=100, blank=True, null=True)
    avds_atual = models.CharField(max_length=100, blank=True, null=True)
    avds_observacoes = models.TextField(blank=True, null=True)

    emocionais_inicio = models.CharField(max_length=100, blank=True, null=True)
    emocionais_atual = models.CharField(max_length=100, blank=True, null=True)
    emocionais_observacoes = models.TextField(blank=True, null=True)

    sintese_evolucao = models.TextField(blank=True, null=True)

    # Orientação ao Paciente
    mensagem_paciente = models.TextField(blank=True, null=True)
    explicacao_continuidade = models.TextField(blank=True, null=True)
    reacoes_paciente = models.TextField(blank=True, null=True)

    # Expectativa x Realidade
    dor_expectativa = models.CharField(max_length=100, blank=True, null=True)
    dor_realidade = models.CharField(max_length=100, blank=True, null=True)
    mobilidade_expectativa = models.CharField(max_length=100, blank=True, null=True)
    mobilidade_realidade = models.CharField(max_length=100, blank=True, null=True)
    energia_expectativa = models.CharField(max_length=100, blank=True, null=True)
    energia_realidade = models.CharField(max_length=100, blank=True, null=True)
    consciencia_expectativa = models.CharField(max_length=100, blank=True, null=True)
    consciencia_realidade = models.CharField(max_length=100, blank=True, null=True)
    emocao_expectativa = models.CharField(max_length=100, blank=True, null=True)
    emocao_realidade = models.CharField(max_length=100, blank=True, null=True)

    # Próximos passos
    objetivos_ciclo = models.TextField(blank=True, null=True)
    condutas_mantidas = models.TextField(blank=True, null=True)
    ajustes_plano = models.TextField(blank=True, null=True)

    # Sugestões complementares
    treino_funcional = models.BooleanField(default=False)
    pilates_clinico = models.BooleanField(default=False)
    recovery = models.BooleanField(default=False)
    rpg = models.BooleanField(default=False)
    nutricao = models.BooleanField(default=False)
    psicoterapia = models.BooleanField(default=False)
    estetica = models.BooleanField(default=False)
    outro_complementar = models.BooleanField(default=False)
    outro_complementar_texto = models.CharField(max_length=100, blank=True, null=True)

    # Registro interno
    observacoes_internas = models.TextField(blank=True, null=True)
    orientacoes_grupo = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-data_criacao']

    def __str__(self):
        return f"Evolução {self.paciente} - {self.data_criacao}"

class AvaliacaoFisioterapeutica(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    profissional = models.ForeignKey(Profissional, on_delete=models.CASCADE)
    agendamento = models.OneToOneField(Agendamento, on_delete=models.SET_NULL, null=True, blank=True)
    data_avaliacao = models.DateTimeField(auto_now_add=True)
    criado_por = models.ForeignKey(User, on_delete=models.CASCADE)
    foi_preenchido = models.BooleanField(default=False)
    nao_se_aplica = models.BooleanField(default=False)
    # Anamnese / Histórico Clínico
    queixa_principal = models.TextField()
    inicio_problema = models.TextField(blank=True)
    causa_problema = models.TextField(blank=True)
    
    # Histórico da doença atual
    dor_recente_antiga = models.CharField(max_length=100, blank=True)
    episodios_anteriores = models.TextField(blank=True)
    tratamento_anterior = models.BooleanField(null=True)
    qual_tratamento = models.TextField(blank=True)
    cirurgia_procedimento = models.TextField(blank=True)
    
    acompanhamento_medico = models.BooleanField(null=True)
    medico_especialidade = models.CharField(max_length=100, blank=True)
    
    diagnostico_medico = models.CharField(max_length=200, blank=True)
    uso_medicamentos = models.TextField(blank=True)
    exames_trazidos = models.BooleanField(null=True)
    tipo_exame = models.CharField(max_length=100, blank=True)
    historico_lesoes = models.TextField(blank=True)
    
    # Histórico pessoal e familiar
    doencas_previas = models.TextField(blank=True)
    cirurgias_previas = models.TextField(blank=True)
    condicoes_geneticas = models.TextField(blank=True)
    historico_familiar = models.TextField(blank=True)
    
    # Hábitos e estilo de vida
    qualidade_sono = models.CharField(max_length=20, blank=True)
    horas_sono = models.TextField(null=True, blank=True, default=0)
    alimentacao = models.CharField(max_length=50, blank=True)
    nivel_atividade = models.CharField(max_length=50, blank=True)
    tipo_exercicio = models.CharField(max_length=100, blank=True)
    nivel_estresse = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        null=True, blank=True
    )
    rotina_trabalho = models.TextField(blank=True)
    aspectos_emocionais = models.TextField(blank=True)
    
    # Sinais, sintomas e dor
    localizacao_dor = models.TextField(blank=True)
    
    tipo_dor_pontada = models.BooleanField(default=False)
    tipo_dor_queimacao = models.BooleanField(default=False)
    tipo_dor_peso = models.BooleanField(default=False)
    tipo_dor_choque = models.BooleanField(default=False)
    tipo_dor_outra = models.BooleanField(default=False)
    tipo_dor_outra_texto = models.CharField(max_length=100, blank=True)
    
    intensidade_repouso = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        null=True, blank=True
    )
    intensidade_movimento = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        null=True, blank=True
    )
    intensidade_pior = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        null=True, blank=True
    )
    
    fatores_agravam = models.TextField(blank=True)
    fatores_aliviam = models.TextField(blank=True)
    
    sinal_edema = models.BooleanField(default=False)
    sinal_parestesia = models.BooleanField(default=False)
    sinal_rigidez = models.BooleanField(default=False)
    sinal_fraqueza = models.BooleanField(default=False)
    sinal_compensacoes = models.BooleanField(default=False)
    sinal_outro = models.BooleanField(default=False)
    sinal_outro_texto = models.CharField(max_length=100, blank=True)
    
    grau_inflamacao = models.CharField(max_length=20, blank=True)
    
    # Exame físico e funcional
    inspecao_postura = models.TextField(blank=True)
    compensacoes_corporais = models.TextField(blank=True)
    padrao_respiratorio = models.TextField(blank=True)
    palpacao = models.TextField(blank=True)
    pontos_dor = models.TextField(blank=True)
    testes_funcionais = models.TextField(blank=True)
    outras_observacoes = models.TextField(blank=True)
    
    mobilidade_regiao = models.TextField(blank=True)
    mobilidade_ativa = models.TextField(blank=True)
    mobilidade_passiva = models.TextField(blank=True)
    mobilidade_dor = models.BooleanField(default=False)
    
    forca_grupo = models.TextField(blank=True)
    forca_grau = models.TextField(blank=True)
    forca_dor = models.BooleanField(default=False)
    
    
    # Diagnóstico Fisioterapêutico
    diagnostico_completo = models.TextField(blank=True)
    grau_dor = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        null=True, blank=True
    )
    limitacao_funcional = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        null=True, blank=True
    )
    grau_inflamacao_num = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(3)],
        null=True, blank=True
    )
    grau_edema = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(3)],
        null=True, blank=True
    )
    receptividade = models.CharField(max_length=20, blank=True, null=True)

    autonomia_avd = models.CharField(max_length=20, blank=True)
    
    # Plano Terapêutico
    objetivo_geral = models.TextField(blank=True)
    objetivo_principal = models.TextField(blank=True)
    objetivo_secundario = models.TextField(blank=True)
    pontos_atencao = models.TextField(blank=True)
    
    # Técnicas manuais
    tecnica_liberacao = models.BooleanField(default=False)
    tecnica_mobilizacao = models.BooleanField(default=False)
    tecnica_dry_needling = models.BooleanField(default=False)
    tecnica_ventosa = models.BooleanField(default=False)
    tecnica_manipulacoes = models.BooleanField(default=False)
    tecnica_outras = models.BooleanField(default=False)
    tecnica_outras_texto = models.CharField(max_length=100, blank=True)
    
    # Recursos eletrofísicos
    recurso_aussie = models.BooleanField(default=False)
    recurso_russa = models.BooleanField(default=False)
    recurso_aussie_tens = models.BooleanField(default=False)
    recurso_us = models.BooleanField(default=False)
    recurso_termo = models.BooleanField(default=False)
    recurso_outro = models.BooleanField(default=False)
    recurso_outro_texto = models.CharField(max_length=100, blank=True)
    
    # Cinesioterapia
    cinesio_fortalecimento = models.BooleanField(default=False)
    cinesio_alongamento = models.BooleanField(default=False)
    cinesio_postural = models.BooleanField(default=False)
    cinesio_respiracao = models.BooleanField(default=False)
    cinesio_mobilidade = models.BooleanField(default=False)
    cinesio_funcional = models.BooleanField(default=False)
    
    descricao_plano = models.TextField(blank=True)
    
    medo_agulha = models.BooleanField(null=True)
    limiar_dor_baixo = models.BooleanField(null=True)
    fragilidade = models.BooleanField(null=True)
    
    frequencia = models.IntegerField(null=True, blank=True)
    duracao = models.IntegerField(null=True, blank=True)
    reavaliacao_sessao = models.CharField(max_length=50, blank=True)
    
    # Prognóstico e orientações
    evolucao_primeira_sessao = models.TextField(blank=True)
    evolucao_proximas_sessoes = models.TextField(blank=True)
    expectativas_primeira_etapa = models.TextField(blank=True)
    proximos_passos = models.TextField(blank=True)
    sobre_orientacoes = models.TextField(blank=True)
    sono_rotina = models.TextField(blank=True)
    postura_ergonomia = models.TextField(blank=True)
    alimentacao_hidratacao = models.TextField(blank=True)
    exercicios_casa = models.TextField(blank=True)
    aspectos_emocionais_espirituais = models.TextField(blank=True)
    
    observacoes_finais = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-data_avaliacao']
    
    def __str__(self):
        return f"Avaliação {self.paciente} - {self.data_avaliacao.date()}"