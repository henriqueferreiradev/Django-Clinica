from itsdangerous import URLSafeTimedSerializer
from django.conf import settings
from core.models import TokenAcessoPublico
from django.utils import timezone
from datetime import timedelta
 

def gerar_token_acesso_unico(finalidade="pre_cadastro", horas=1):
    s = URLSafeTimedSerializer(settings.SECRET_KEY)
    token = s.dumps(finalidade, salt="formulario_paciente")

    TokenAcessoPublico.objects.create(
        token=token,
        finalidade=finalidade,
        expira_em=timezone.now() + timedelta(hours=horas)
    )

    return token

# tokens.py
from itsdangerous import BadSignature, SignatureExpired

def verificar_token_acesso(token, ip=None):
    try:
        s = URLSafeTimedSerializer(settings.SECRET_KEY)
        payload = s.loads(token, salt="formulario_paciente")
    except (BadSignature, SignatureExpired):
        return None, "invalido"

    registro = TokenAcessoPublico.objects.filter(token=token, ativo=True).first()

    if not registro:
        return None, "inexistente"

    if registro.is_expired():
        return None, "expirado"

    if registro.is_used():
        return None, "ja_utilizado"

    return registro, "ok"

# core/security.py
from django.core.cache import cache

def rate_limit_ip(request, prefixo, limite=5, janela=3600):
    """
    prefixo: string única da ação (ex: 'pre_cadastro')
    limite: tentativas permitidas
    janela: tempo em segundos
    """
    ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
    chave = f"rate_{prefixo}_{ip}"

    tentativas = cache.get(chave, 0)

    if tentativas >= limite:
        return False

    cache.set(chave, tentativas + 1, janela)
    return True