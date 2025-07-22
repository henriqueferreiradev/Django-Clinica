from itsdangerous import URLSafeTimedSerializer
from django.conf import settings

def gerar_token_precadastro(paciente_id):
    s = URLSafeTimedSerializer(settings.SECRET_KEY)
    return s.dumps(paciente_id, salt='pre_cadastro')

def verificar_token_precadastro(token, tempo_expiracao=60):
    s = URLSafeTimedSerializer(settings.SECRET_KEY)
    try: 
        paciente_id = s.loads(token, salt='pre_cadastro', max_age=tempo_expiracao)
        return paciente_id
    except Exception:
        return None
    