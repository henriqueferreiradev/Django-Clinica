from itsdangerous import URLSafeTimedSerializer
from django.conf import settings

def gerar_token_acesso_unico(payload="formulario_pre_cadastro"):
    s = URLSafeTimedSerializer(settings.SECRET_KEY)
    return s.dumps(payload, salt="formulario_paciente")

<<<<<<< HEAD
def verificar_token_acesso(token, tempo_expiracao=86400):  # 24h padrão
=======
def verificar_token_acesso(token, tempo_expiracao=20):  # 24h padrão
>>>>>>> origin/main
    s = URLSafeTimedSerializer(settings.SECRET_KEY)
    try:
        payload = s.loads(token, salt="formulario_paciente", max_age=tempo_expiracao)
        return payload
    except Exception:
        return None