# core/management/commands/importar_pacientes.py
import re
from datetime import datetime

import pandas as pd
from django.core.management.base import BaseCommand

from core.models import Paciente


# ----------------- helpers -----------------
BOOL_MAP = {
    "sim": True,
    "não": False,
    "nao": False,
    "true": True,
    "false": False,
    "": False,
    None: False,
}

def safe_str(v, default: str = "") -> str:
    """Converte valor (inclusive NaN) para string segura, já com strip()."""
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return default
    s = str(v).strip()
    return s if s else default

def normalize_cpf(cpf_raw: object) -> str:
    """Mantém apenas dígitos e aplica máscara ###.###.###-## quando possível."""
    if cpf_raw is None or (isinstance(cpf_raw, float) and pd.isna(cpf_raw)):
        return ""
    digits = re.sub(r"\D", "", str(cpf_raw))
    if len(digits) == 11:
        return f"{digits[:3]}.{digits[3:6]}.{digits[6:9]}-{digits[9:]}"
    return digits

def parse_bool(v) -> bool:
    key = safe_str(v).lower()
    return BOOL_MAP.get(key, False)

def parse_date(v):
    """Converte datas do Excel/strings para date; retorna None se impossível."""
    if v is None or (isinstance(v, float) and pd.isna(v)) or v == "":
        return None
    if isinstance(v, datetime):
        return v.date()
    try:
        return pd.to_datetime(v, dayfirst=True, errors="coerce").date()
    except Exception:
        return None


# ----------------- comando -----------------
class Command(BaseCommand):
    help = "Importa/atualiza Pacientes a partir de um arquivo .xlsx"

    def add_arguments(self, parser):
        parser.add_argument("xlsxfile", type=str, help="Caminho do arquivo Excel")

    def handle(self, *args, **opts):
        path = opts["xlsxfile"]

        try:
            df = pd.read_excel(path, engine="openpyxl")
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Erro lendo Excel: {e}"))
            return

        self.stdout.write("=== DEBUG: Colunas ===")
        self.stdout.write(str(list(df.columns)))

        criados = atualizados = ignorados = 0

        for _, row in df.iterrows():
            cpf = normalize_cpf(row.get("CPF"))
            if not cpf:
                ignorados += 1
                self.stdout.write(self.style.WARNING("⚠️  Linha ignorada (sem CPF)."))
                continue

            defaults = {
                "nome": safe_str(row.get("Nome")),
                "sobrenome": safe_str(row.get("Sobrenome")),
                "nomeSocial": safe_str(row.get("Nome Social"), "Não informado"),
                "rg": safe_str(row.get("RG")),
                "cpf": cpf,
                "data_nascimento": parse_date(row.get("Nascimento")),

                "cor_raca": safe_str(row.get("Cor/Raça"), "Não informado"),
                "sexo": safe_str(row.get("Sexo"), "Não informado"),
                "estado_civil": safe_str(row.get("Estado Civil"), "Não informado"),
                "profissao": safe_str(row.get("Profissão"), "Não informado"),

                "naturalidade": safe_str(row.get("Naturalidade")),
                "uf": safe_str(row.get("UF")),
                "midia": safe_str(row.get("Como nos conheceu")),
                "redeSocial": safe_str(row.get("Rede Social"), "Não informado"),

                "observacao": safe_str(row.get("Observação")),

                "cep": safe_str(row.get("CEP")),
                "rua": safe_str(row.get("Rua")),
                "numero": safe_str(row.get("Número")),
                "complemento": safe_str(row.get("Complemento")),
                "bairro": safe_str(row.get("Bairro")),
                "cidade": safe_str(row.get("Cidade")),
                "estado": safe_str(row.get("Estado")),

                "telefone": safe_str(row.get("Telefone")),
                "celular": safe_str(row.get("Celular")),
                "email": safe_str(row.get("Email")),

                "nomeEmergencia": safe_str(row.get("Contato de Emergência")),
                "vinculo": safe_str(row.get("Vínculo Emergência"), "outro"),
                "telEmergencia": safe_str(row.get("Telefone Emergência")),

                "consentimento_lgpd": parse_bool(row.get("Consentimento")),
                "consentimento_marketing": parse_bool(row.get("Consentimento Marketing")),
                "politica_privacidade_versao": safe_str(row.get("Política de Privacidade")),
                "data_consentimento": parse_date(row.get("Data Consentimento")),

                # novos campos
                "ativo": parse_bool(row.get("Ativo")),
                "conferido": parse_bool(row.get("Conferido")),
            }

            paciente, created = Paciente.objects.update_or_create(
                cpf=cpf,
                defaults=defaults,
            )

            if created:
                criados += 1
                self.stdout.write(self.style.SUCCESS(f"[CRIADO] {paciente.nome} ({cpf})"))
            else:
                atualizados += 1
                self.stdout.write(self.style.WARNING(f"[ATUALIZADO] {paciente.nome} ({cpf})"))

        self.stdout.write(self.style.SUCCESS(
            f"Concluído! Criados={criados}, Atualizados={atualizados}, Ignorados (sem CPF)={ignorados}"
        ))
