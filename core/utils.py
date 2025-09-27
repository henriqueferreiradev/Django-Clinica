# -*- coding: utf-8 -*-

import os
from django.utils.text import slugify
from django.conf import settings
import locale
import calendar
from datetime import date, timedelta
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.shortcuts import get_object_or_404, redirect
from .models import Agendamento, LogAcao
from django.contrib import messages

locale.setlocale(locale.LC_TIME, 'pt_BR.UTF-8')
def criar_pasta_foto_paciente(id_paciente, nome_paciente):
    nome = slugify(nome_paciente)
    caminho = os.path.join(settings.MEDIA_ROOT, f'imagens/pacientes/{id_paciente}_{nome}')
    os.makedirs(caminho, exist_ok=True)


def criar_pasta_foto_profissional(id_profissional, nome_profissional):
    nome = slugify(nome_profissional)
    caminho = os.path.join(settings.MEDIA_ROOT, f'imagens/profissionais/{id_profissional}_{nome}')
    os.makedirs(caminho, exist_ok=True)


def filtrar_ativos_inativos(request, modelo, prefixo=''):
    mostrar_todos = request.GET.get(f'mostrar_todos_{prefixo}') == 'on'
    filtra_inativo = request.GET.get(f'filtra_inativo_{prefixo}') == 'on'
    
    if mostrar_todos:
        queryset = modelo.objects.all().order_by('-id')
    elif filtra_inativo:
        queryset = modelo.objects.filter(ativo=False)
    else:
        queryset = modelo.objects.filter(ativo=True).order_by('-id')

    total_ativos = modelo.objects.filter(ativo=True).count()

    return queryset, total_ativos, mostrar_todos, filtra_inativo

def alterar_status_ativo(request, modelo, ativar=True, prefixo=''):
    obj_id = request.POST.get(f'{prefixo}_id')
    if obj_id:
        try:
            obj = modelo.objects.get(id=obj_id)
            obj.ativo = ativar
            obj.save()
        except modelo.DoesNotExist:
            print(f"{modelo.__name__} com ID {obj_id} não encontrado para alteração de status.")
    else:
        print(f"ID não enviado para alteração de status em {modelo.__name__}.")

# core/utils.py
from datetime import datetime

def _tipo_beneficio(ag):
    tags = (ag.tags or '')
    if 'beneficio:sessao_livre' in tags:
        return 'sessao_livre'
    if 'beneficio:relaxante' in tags:
        return 'relaxante'
    if 'beneficio:desconto' in tags:
        return 'desconto'
    if 'beneficio:brinde' in tags:
        return 'brinde'
    return None

def gerar_mensagem_confirmacao(ag):
    """
    Mensagem de confirmação para WhatsApp/E-mail.
    Suporta agendamentos COM pacote e SEM pacote (benefícios de status).
    """
    pac = ag.paciente
    prof = getattr(ag, 'profissional_1', None)
    serv = getattr(ag, 'servico', None)
    especialidade = ag.especialidade
    pac_nome = f"{getattr(pac, 'nome', '')} {getattr(pac, 'sobrenome', '')}".strip()
    prof_nome = "A definir"
    if prof:
        prof_nome = f"{getattr(prof, 'nome', '')} {getattr(prof, 'sobrenome', '')}".strip() or "A definir"

    data_str = ag.data.strftime('%d/%m/%Y') if getattr(ag, 'data', None) else ''
    dia_semana = ag.data.strftime('%A').capitalize() if getattr(ag, 'data', None) else ''
    hora_ini = ag.hora_inicio.strftime('%H:%M') if getattr(ag, 'hora_inicio', None) else ''
    hora_fim = ag.hora_fim.strftime('%H:%M') if getattr(ag, 'hora_fim', None) else ''
    local = ag.ambiente or 'A confirmar'

    # Bloco de sessão (pacote vs benefício)
    sessao_info = ''
    pacote = getattr(ag, 'pacote', None)
    if pacote:
        try:
            atual = pacote.get_sessao_atual(ag)
        except Exception:
            atual = None
        total = getattr(pacote, 'qtd_sessoes', 0) or 0
        codigo = getattr(pacote, 'codigo', '') or 'Pacote'
        if isinstance(atual, int) and total:
            restantes = max(total - atual, 0)
            sessao_info = f"Sessão {atual} de {total} | {restantes} restante(s) | {codigo}"
        else:
            sessao_info = f"Pacote: {codigo}"
    else:
        ben = _tipo_beneficio(ag)
        if ben == 'sessao_livre':
            sessao_info = "Sessão livre (benefício de status)"
        elif ben == 'relaxante':
            sessao_info = "Sessão relaxante (benefício de status)"
        elif serv:
            sessao_info = f"Serviço: {getattr(serv, 'nome', 'Atendimento')}"
        else:
            sessao_info = "Atendimento"

    mensagem = (f"Olá, {pac_nome}! Sua sessão está confirmada! ☺️\n"
                f"Aqui é a Bem, IA da Ponto de Equilíbrio, tudo bem?\n\n"
                f"Passando para deixar o lembrete de seu(s) próximo(s) horário(s) agendado(s)\n\n"
                f"🟣 *Atividade*: {especialidade}\n"
                f"👩‍⚕️ *Profissional:* {prof}\n"
                f"🗓 *Data:* {data_str} ({dia_semana})\n"
                f"⏰ *Horário:* {hora_ini} às {hora_fim}\n\n"
                f"Qualquer dúvida, estou por aqui.\n" f"Até lá! 🌟" )
    return mensagem


from django.core.mail import send_mail

def enviar_lembrete_agendamento(paciente_nome, paciente_email, numero_whatsapp):
    assunto = 'Lembrete de Sessão Agendada'
    mensagem = (
        f"Olá, {paciente_nome}!\n\n"
        "Sua sessão foi agendada. Esse é apenas um lembrete.\n\n"
        f"Em caso de dúvida, não hesite em nos mandar uma mensagem: {numero_whatsapp}\n\n"
        "Até breve!"
    )
     
    send_mail(
        subject=assunto,
        message=mensagem,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[paciente_email],
        fail_silently=False,
    )



def enviar_lembrete_email(destinatario, contexto):
    assunto = "Sessão Agendada com sucesso"
    remetente = "twzgames@gmail.com"
    destinatarios = [destinatario]


    conteudo = render_to_string('core/agendamentos/email_agendamento.html', contexto)

    email = EmailMultiAlternatives(assunto,'', remetente, destinatarios)
    email.attach_alternative(conteudo, 'text/html')
    email.send()
    
def alterar_status_agendamento(request, pk, redirect_para):
    if request.method == "POST":
        agendamento = get_object_or_404(Agendamento, pk=pk)
        novo_status = request.POST.get('status')

        if novo_status:
            agendamento.status = novo_status
            agendamento.save()
            messages.success(request, f'Status alterado com sucesso.')

    return redirect(redirect_para)

def get_semana_atual():
    hoje = date.today()
    inicio_semana = hoje - timedelta(days=hoje.weekday())  # Segunda-feira
    fim_semana = inicio_semana + timedelta(days=6)
    return inicio_semana, fim_semana


def calcular_porcentagem_formas(queryset):
    total = sum(item['quantidade'] for item in queryset)
    
    resultado = []
    for item in queryset:
        porcentagem = (item['quantidade'] / total) * 100 if total > 0 else 0
        resultado.append({
            'forma_pagamento': item['forma_pagamento'],
            'quantidade': item['quantidade'],
            'porcentagem': round(porcentagem, 2)  # arredonda para 2 casas decimais
        })
    return resultado


def registrar_log(usuario, acao, modelo, objeto_id, descricao=''):
    LogAcao.objects.create(usuario=usuario, acao=acao, modelo=modelo, objeto_id=objeto_id, descricao=descricao)