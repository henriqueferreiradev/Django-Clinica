import pandas as pd
import re, unicodedata
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import Paciente, FrequenciaMensal

# -------- util --------
MESES_MAP = {
    "JANEIRO":1,"FEVEREIRO":2,"MARCO":3,"MARÇO":3,"ABRIL":4,"MAIO":5,
    "JUNHO":6,"JULHO":7,"AGOSTO":8,"SETEMBRO":9,"OUTUBRO":10,"NOVEMBRO":11,"DEZEMBRO":12
}

def limpa_cpf(v):
    if pd.isna(v): return ""
    if isinstance(v, float): v = str(int(v))
    return re.sub(r"\D", "", str(v))

def strip_accents_upper(s: str) -> str:
    s = unicodedata.normalize("NFKD", str(s)).encode("ASCII","ignore").decode("utf-8")
    return s.strip().upper()

def normaliza_status(v):
    if v is None or str(v).strip() in {"", "-", "—"}:
        return "indefinido"
    s = strip_accents_upper(v)
    if "1" in s and "MES" in s: return "primeiro_mes"
    if "PREMIUM" in s: return "premium"
    if "VIP" in s: return "vip"
    if "PLUS" in s: return "plus"
    if "XXX" in s: return "indefinido"
    return "indefinido"

def tenta_ano(token):
    t = str(token).strip()
    return int(t) if t.isdigit() else None

# -------- comando --------
class Command(BaseCommand):
    help = "Importa STATUS, freq_sistema e freq_programada da planilha (layout com: linha0=anos, linha1=meses, linha2=tipos)."

    def add_arguments(self, parser):
        parser.add_argument("xlsxfile", type=str)

    def handle(self, *args, **opts):
        file_path = opts["xlsxfile"]

        # Lê sem header para capturar linhas 0/1/2
        df = pd.read_excel(file_path, sheet_name=0, engine="openpyxl", header=None)

        row0 = df.iloc[0]  # anos (NOME | CPF | 2024 | ... | 2025 | ...)
        row1 = df.iloc[1]  # meses (JANEIRO, FEVEREIRO, ...)
        row2 = df.iloc[2]  # tipos (STATUS, FREQ_SISTEMA, FREQ_PROGRAMADA)

        # header real = linha 0
        df.columns = row0
        df = df.drop([0, 1, 2]).reset_index(drop=True)

        # mapa CPF (apenas dígitos) -> paciente_id
        pacientes_map = {limpa_cpf(p.cpf): p.id for p in Paciente.objects.all()}

        print("\n=== DEBUG: Estrutura ===")
        print("Colunas:", list(df.columns)[:16], "...")
        print("Meses (row1):", list(row1)[:16])
        print("Tipos (row2):", list(row2)[:16])
        print(f"[DEBUG] Pacientes mapeados: {len(pacientes_map)}")

        criados, atualizados = 0, 0
        nao_encontrados = []

        for _, row in df.iterrows():
            # pular linhas vazias
            if pd.isna(row.get("NOME")) and pd.isna(row.get("CPF")):
                continue

            nome = row["NOME"]
            cpf = limpa_cpf(row["CPF"])
            pid = pacientes_map.get(cpf)
            print(f"\n-- Paciente: {nome} | CPF={cpf} | pid={pid}")

            if not pid:
                nao_encontrados.append((nome, cpf))
                continue

            ano_atual = None
            mes_atual = None
            status = None
            freq_sistema = None
            freq_programada = None

            for c in range(2, len(df.columns)):
                col_name = df.columns[c]           # 2024, NaN, NaN, ..., 2025, ...
                tipo = str(row2.iloc[c]).strip().upper()  # STATUS / FREQ_SISTEMA / FREQ_PROGRAMADA
                mes_raw = row1.iloc[c]
                val = row.iloc[c]

                # detecta/atualiza ano
                maybe_year = tenta_ano(col_name)
                if maybe_year is not None:
                    ano_atual = maybe_year
                    # opcional: ao mudar de ano, reinicia o mês corrente (será setado na próxima célula com mês)
                    print(f"   [DEBUG] Novo ano detectado: {ano_atual} (col {c})")
                    continue
                if not ano_atual:
                    continue

                # persiste mês: só atualiza quando a célula de meses tiver valor
                if pd.notna(mes_raw):
                    mes_atual = strip_accents_upper(mes_raw)

                mes_num = MESES_MAP.get(mes_atual, None)
                if not mes_num:
                    continue

                # capturar os três valores por mês
                if tipo == "STATUS":
                    status = normaliza_status(val)
                elif tipo == "FREQ_SISTEMA":
                    freq_sistema = int(val) if pd.notna(val) else 0
                elif tipo == "FREQ_PROGRAMADA":
                    freq_programada = int(val) if pd.notna(val) else 0

                    # temos o trio na passagem do FREQ_PROGRAMADA
                    # se tudo estiver vazio, não salvar
                    if (status in (None, "indefinido")) and (not freq_sistema) and (not freq_programada):
                        continue

                    # get_or_create e depois atualizar tudo para garantir save() e cálculo do percentual
                    obj, created = FrequenciaMensal.objects.get_or_create(
                        paciente_id=pid,
                        mes=mes_num,
                        ano=ano_atual,
                    )

                    obj.status = status or obj.status
                    obj.freq_sistema = freq_sistema or 0
                    obj.freq_programada = freq_programada or 0

                    # campos solicitados:
                    obj.programada_set_por_id = 1
                    obj.programada_set_em = timezone.now()

                    # save() do modelo já chama atualizar_percentual_e_status()
                    obj.save()

                    if created:
                        criados += 1
                        print(f"   [NOVO] pid={pid} {ano_atual}/{mes_num:02d} -> {obj.status} | fs={obj.freq_sistema} fp={obj.freq_programada} | perc={obj.percentual}")
                    else:
                        atualizados += 1
                        print(f"   [ATUALIZADO] pid={pid} {ano_atual}/{mes_num:02d} -> {obj.status} | fs={obj.freq_sistema} fp={obj.freq_programada} | perc={obj.percentual}")

        print("\n=== RESUMO ===")
        print(f"Criados: {criados} | Atualizados: {atualizados}")
        if nao_encontrados:
            print("Não encontrados:")
            for n, c in nao_encontrados:
                print(f" - {n} ({c})")
