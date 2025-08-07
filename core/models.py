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
     
    data_cadastro = models.DateField(default=date.today, blank=True, null=True)
    ativo = models.BooleanField(default=True)
    pre_cadastro = models.BooleanField(default=False)
    conferido = models.BooleanField(default=False)
    
    def __str__(self):
        return self.nome

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
            senha_padrao = 'resiliencia'
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
        return self.valor_final - self.total_pago

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
    forma_pagamento = models.CharField(max_length=30, choices=[
        ('pix', 'Pix'),
        ('credito', 'Cartão de Crédito'),
        ('debito', 'Cartão de Débito'),
        ('dinheiro', 'Dinheiro'),
    ])
  

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
    
    
    
    
    
    
    
    
    
    
    








from django.db import models
from core.models import Paciente  # ou de onde estiver importado
import uuid

TIPO_PERGUNTA = (
    ('short-text', 'Texto Curto'),
    ('paragraph', 'Parágrafo'),
    ('multiple-choice', 'Múltipla Escolha'),
    ('checkbox', 'Checkbox'),
    ('dropdown', 'Dropdown'),
)

class Formulario(models.Model):
    titulo = models.CharField(max_length=255)
    descricao = models.TextField()
    criado_em = models.DateTimeField(auto_now_add=True)
    slug = models.SlugField(unique=True, blank=True, null=True)


    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.titulo)
        super().save(*args, **kwargs)

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
