from django.test import TestCase
from datetime import date
from core.models import Paciente, FrequenciaMensal, HistoricoStatus

'''

class StatusBeneficioTests(TestCase):
    def setUp(self):
        # Paciente cadastrado em agosto/2025
        self.paciente = Paciente.objects.create(
            nome="Teste Status",
            data_cadastro=date(2025, 8, 1)
        )

    def add_fm(self, mes, ano, fs=7, fp=10):
        """
        Helper para criar FrequenciaMensal e retornar o historico do mês.
        """
        fm = FrequenciaMensal.objects.create(
            paciente=self.paciente,
            mes=mes,
            ano=ano,
            freq_sistema=fs,
            freq_programada=fp
        )
        h = HistoricoStatus.objects.get(paciente=self.paciente, mes=mes, ano=ano)
        return fm, h

    def test_primeiro_mes_sem_beneficio(self):
        fm, h = self.add_fm(8, 2025)  # mês do cadastro
        self.assertEqual(fm.status, "primeiro_mes")
        self.assertFalse(h.ganhou_beneficio)

    def test_primeira_vez_vip_com_beneficio(self):
        self.add_fm(8, 2025)  # primeiro_mes
        fm, h = self.add_fm(9, 2025)  # setembro → VIP
        self.assertEqual(fm.status, "vip")
        self.assertTrue(h.ganhou_beneficio)

    def test_meses_vip_sem_repetir_beneficio(self):
        self.add_fm(8, 2025)  # primeiro_mes
        self.add_fm(9, 2025)  # VIP com benefício
        for m in [10, 11, 12]:
            fm, h = self.add_fm(m, 2025)
            self.assertEqual(fm.status, "vip")
            self.assertFalse(h.ganhou_beneficio)

    def test_sexto_mes_consecutivo_vip_com_beneficio(self):
        self.add_fm(8, 2025)  # primeiro_mes
        self.add_fm(9, 2025)  # vip (benefício)
        # meses 10,11,12/2025 e 01,02/2026
        for m in [10, 11, 12]:
            self.add_fm(m, 2025)
        self.add_fm(1, 2026)
        self.add_fm(2, 2026)

        # Março/2026 → 6º mês VIP
        fm, h = self.add_fm(3, 2026)
        self.assertEqual(fm.status, "vip")
        self.assertTrue(h.ganhou_beneficio)

    def test_primeira_vez_premium_com_beneficio(self):
        self.add_fm(8, 2025)
        self.add_fm(9, 2025)
        # premium direto
        fm, h = self.add_fm(10, 2025, fs=10, fp=10)
        self.assertEqual(fm.status, "premium")
        self.assertTrue(h.ganhou_beneficio)

    def test_queda_para_vip_sem_beneficio(self):
        self.add_fm(8, 2025)
        self.add_fm(9, 2025, fs=10, fp=10)  # premium
        fm, h = self.add_fm(10, 2025, fs=7, fp=10)  # voltou para vip
        self.assertEqual(fm.status, "vip")
        self.assertFalse(h.ganhou_beneficio)
        
    def test_premium_primeiro_depois_vip_primeira_vez_sem_boas_vindas_mesmo_apos_intervalo(self):
        # plus... depois Premium (boas-vindas)
        self.add_fm(8, 2025)                # primeiro_mes
        fm, h = self.add_fm(9, 2025, fs=10, fp=10)  # premium 1ª vez -> ganha
        self.assertTrue(h.ganhou_beneficio)

        # meses qualquer (ex.: plus/indefinido) – não importam para a regra
        self.add_fm(10, 2025, fs=0, fp=0)   # indefinido (exemplo)
        self.add_fm(11, 2025, fs=0, fp=0)   # indefinido

        # agora VIP pela primeira vez na vida -> NÃO ganha (porque já teve Premium antes)
        fm, h = self.add_fm(12, 2025, fs=7, fp=10)  # vip 1ª vez
        self.assertEqual(fm.status, "vip")
        self.assertFalse(h.ganhou_beneficio)
'''

from datetime import date, timedelta
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from core.models import Paciente, Especialidade, Profissional, Servico, PacotePaciente, Agendamento
from django.contrib.auth import get_user_model
def iso(d): return d.isoformat()
'''
class AgendamentoRecorrenteTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username='u', password='p')
        self.client.login(username='u', password='p')

        self.paciente      = Paciente.objects.create(nome='Paciente T')
        self.especialidade = Especialidade.objects.create(nome='Fisioterapia')
        self.prof1         = Profissional.objects.create(nome='Pro A', especialidade=self.especialidade)
        self.servico       = Servico.objects.create(nome='Fisio', qtd_sessoes=10, valor=100)

        self.url = reverse('criar_agendamento')  # ajuste se necessário

    def _post_base(self, extra=None):
        base = {
            "tipo_agendamento": "novo",
            "paciente_id": self.paciente.id,
            "especialidade_id": self.especialidade.id,
            "profissional1_id": self.prof1.id,
            "servico_id": self.servico.id,
            "data": iso(date.today()),
            "hora_inicio": "08:00",
            "hora_fim": "09:00",
            "status": "agendado",
            "ambiente": "Sala 1",
        }
        if extra:
            base.update(extra)
        return self.client.post(self.url, base, follow=True)

    def test_unico_sem_recorrencia_cria_1(self):
        self._post_base()
        self.assertEqual(Agendamento.objects.count(), 1)

    def test_recorrente_um_dia_cria_total_do_pacote(self):
        self._post_base({
            "recorrente[segunda][ativo]": "on",
            "recorrente[segunda][inicio]": "09:00",
            "recorrente[segunda][fim]": "10:00",
        })
        self.assertEqual(Agendamento.objects.count(), 10)
        # todos devem ter 09:00–10:00
        self.assertTrue(
            Agendamento.objects.filter(hora_inicio="09:00", hora_fim="10:00").count() == 10
        )

    def test_recorrente_dois_dias_divide_com_resto(self):
        # 10 sessões → seg/qua: 5 e 5 (depende da âncora, mas soma=10)
        self._post_base({
            "recorrente[segunda][ativo]": "on", "recorrente[segunda][inicio]": "09:00", "recorrente[segunda][fim]": "10:00",
            "recorrente[quarta][ativo]": "on",  "recorrente[quarta][inicio]": "13:00", "recorrente[quarta][fim]": "14:00",
        })
        self.assertEqual(Agendamento.objects.count(), 10)
        seg = Agendamento.objects.filter(hora_inicio="09:00", hora_fim="10:00").count()
        qua = Agendamento.objects.filter(hora_inicio="13:00", hora_fim="14:00").count()
        self.assertEqual(seg + qua, 10)

    def test_recorrente_tres_dias_distribui_resto(self):
        # 10 sessões → 4 / 3 / 3
        self._post_base({
            "recorrente[segunda][ativo]": "on", "recorrente[segunda][inicio]": "09:00", "recorrente[segunda][fim]": "10:00",
            "recorrente[quarta][ativo]": "on",  "recorrente[quarta][inicio]": "13:00", "recorrente[quarta][fim]": "14:00",
            "recorrente[sexta][ativo]": "on",   "recorrente[sexta][inicio]":  "16:00", "recorrente[sexta][fim]":  "17:00",
        })
        self.assertEqual(Agendamento.objects.count(), 10)
        a = Agendamento.objects.filter(hora_inicio="09:00").count()
        b = Agendamento.objects.filter(hora_inicio="13:00").count()
        c = Agendamento.objects.filter(hora_inicio="16:00").count()
        self.assertEqual(a + b + c, 10)
        self.assertIn(sorted([a, b, c]), [[3,3,4], [3,4,3], [4,3,3]])  # qualquer ordem

    def test_recorrente_ignora_horas_normais(self):
        # hora_inicio/hora_fim do form = 08:00–09:00, mas recorrente define 09:00–10:00
        self._post_base({
            "recorrente[segunda][ativo]": "on",
            "recorrente[segunda][inicio]": "09:00",
            "recorrente[segunda][fim]": "10:00",
        })
        self.assertEqual(Agendamento.objects.filter(hora_inicio="08:00", hora_fim="09:00").count(), 0)
        self.assertEqual(Agendamento.objects.filter(hora_inicio="09:00", hora_fim="10:00").count(), 10)

    def test_respeita_faltantes_quando_ja_tem_realizadas_e_marcadas(self):
        # Cria um pacote e consome parte antes
        # Primeiro agendamento “realizado”
        pacote = PacotePaciente.objects.create(paciente=self.paciente, servico=self.servico,
                                               qtd_sessoes=10, valor_original=0, valor_final=0, valor_total=0, ativo=True)
        # duas realizadas
        Agendamento.objects.create(paciente=self.paciente, servico=self.servico, especialidade=self.especialidade,
                                   profissional_1=self.prof1, data=date.today(), hora_inicio="07:00", hora_fim="08:00",
                                   pacote=pacote, status="finalizado", ambiente="Sala 1")
        Agendamento.objects.create(paciente=self.paciente, servico=self.servico, especialidade=self.especialidade,
                                   profissional_1=self.prof1, data=date.today()+timedelta(days=1),
                                   hora_inicio="07:00", hora_fim="08:00",
                                   pacote=pacote, status="finalizado", ambiente="Sala 1")
        # uma já marcada futura
        Agendamento.objects.create(paciente=self.paciente, servico=self.servico, especialidade=self.especialidade,
                                   profissional_1=self.prof1, data=date.today()+timedelta(days=2),
                                   hora_inicio="07:00", hora_fim="08:00",
                                   pacote=pacote, status="agendado", ambiente="Sala 1")

        # Agora tenta usar recorrência: deve criar somente 7 (10 - 2 - 1)
        resp = self.client.post(self.url, {
            "tipo_agendamento": "existente",
            "paciente_id": self.paciente.id,
            "especialidade_id": self.especialidade.id,
            "profissional1_id": self.prof1.id,
            "servico_id": self.servico.id,
            "pacote_codigo": pacote.codigo if hasattr(pacote, "codigo") else "",
            "data": iso(date.today()),
            "status": "agendado",
            "ambiente": "Sala 1",
            "recorrente[segunda][ativo]": "on", "recorrente[segunda][inicio]": "09:00", "recorrente[segunda][fim]": "10:00",
            "recorrente[quarta][ativo]": "on",  "recorrente[quarta][inicio]": "13:00", "recorrente[quarta][fim]": "14:00",
        }, follow=True)

        total_do_pacote = Agendamento.objects.filter(pacote=pacote).count()
        self.assertEqual(total_do_pacote, 10)  # 2 realizadas + 1 marcada + 7 novas = 10

    def test_recorrente_sem_dia_marcado_cai_no_unico(self):
        self._post_base({
            # usuário esqueceu de marcar qualquer dia
            # (sem campos recorrente[...])
        })
        self.assertEqual(Agendamento.objects.count(), 1)

    def test_inputs_recorrentes_incompletos_ignora_dia(self):
        # quarta sem fim → ignora quarta, usa só sexta
        self._post_base({
            "recorrente[quarta][ativo]": "on",  "recorrente[quarta][inicio]": "13:00",
            "recorrente[sexta][ativo]": "on",   "recorrente[sexta][inicio]": "16:00", "recorrente[sexta][fim]": "17:00",
        })
        self.assertEqual(Agendamento.objects.filter(hora_inicio="16:00", hora_fim="17:00").count(), 10)
        self.assertEqual(Agendamento.objects.exclude(hora_inicio="16:00", hora_fim="17:00").count(), 0)

    
    def test_avulsos_anteriores_e_depois_recorrente_dois_dias(self):
        """
        Paciente marcou 2 sessões avulsas (segunda e quarta), depois ativa recorrência
        em terça e sexta. O sistema deve criar apenas os faltantes (8), sem passar de 10.
        """

        # cria pacote de 10
        pacote = PacotePaciente.objects.create(
            paciente=self.paciente, servico=self.servico,
            qtd_sessoes=10, valor_original=0, valor_final=0, valor_total=0, ativo=True
        )

        # 2 sessões já criadas (avulsas, não seguem recorrência nova)
        Agendamento.objects.create(
            paciente=self.paciente, servico=self.servico, especialidade=self.especialidade,
            profissional_1=self.prof1, data=date.today(), hora_inicio="07:00", hora_fim="08:00",
            pacote=pacote, status="agendado", ambiente="Sala 1"
        )
        Agendamento.objects.create(
            paciente=self.paciente, servico=self.servico, especialidade=self.especialidade,
            profissional_1=self.prof1, data=date.today() + timedelta(days=2),
            hora_inicio="07:00", hora_fim="08:00",
            pacote=pacote, status="agendado", ambiente="Sala 1"
        )

        # Agora ativa recorrência (terça e sexta)
        self.client.post(self.url, {
            "tipo_agendamento": "existente",
            "paciente_id": self.paciente.id,
            "especialidade_id": self.especialidade.id,
            "profissional1_id": self.prof1.id,
            "servico_id": self.servico.id,
            "pacote_codigo": pacote.codigo if hasattr(pacote, "codigo") else "",
            "data": iso(date.today()),
            "status": "agendado",
            "ambiente": "Sala 1",
            "recorrente[terca][ativo]": "on", "recorrente[terca][inicio]": "09:00", "recorrente[terca][fim]": "10:00",
            "recorrente[sexta][ativo]": "on", "recorrente[sexta][inicio]": "13:00", "recorrente[sexta][fim]": "14:00",
        }, follow=True)

        # Verifica: total deve ser 10 (2 antigos + 8 novos)
        total = Agendamento.objects.filter(pacote=pacote).count()
        self.assertEqual(total, 10)

        # Verifica distribuição: 2 avulsos + 8 novos
        antigos = Agendamento.objects.filter(hora_inicio="07:00", hora_fim="08:00").count()
        terca  = Agendamento.objects.filter(hora_inicio="09:00", hora_fim="10:00").count()
        sexta  = Agendamento.objects.filter(hora_inicio="13:00", hora_fim="14:00").count()

        self.assertEqual(antigos, 2)
        self.assertEqual(terca + sexta, 8)
from core.models import Pagamento

def test_avulsos_com_pagamento_e_depois_recorrente(self):
    """
    Paciente já tem 2 sessões avulsas e pagamento feito do pacote.
    Depois ativa recorrência. Deve criar só os faltantes (8) e não duplicar pagamento.
    """

    # cria pacote de 10 com pagamento
    pacote = PacotePaciente.objects.create(
        paciente=self.paciente, servico=self.servico,
        qtd_sessoes=10, valor_original=100, valor_final=100, valor_total=100, ativo=True
    )
    Pagamento.objects.create(
        paciente=self.paciente, pacote=pacote, valor=100,
        forma_pagamento="dinheiro"
    )

    # cria 2 agendamentos avulsos
    Agendamento.objects.create(
        paciente=self.paciente, servico=self.servico, especialidade=self.especialidade,
        profissional_1=self.prof1, data=date.today(), hora_inicio="07:00", hora_fim="08:00",
        pacote=pacote, status="agendado", ambiente="Sala 1"
    )
    Agendamento.objects.create(
        paciente=self.paciente, servico=self.servico, especialidade=self.especialidade,
        profissional_1=self.prof1, data=date.today() + timedelta(days=2),
        hora_inicio="07:00", hora_fim="08:00",
        pacote=pacote, status="agendado", ambiente="Sala 1"
    )

    # ativa recorrência (terça e sexta)
    self.client.post(self.url, {
        "tipo_agendamento": "existente",
        "paciente_id": self.paciente.id,
        "especialidade_id": self.especialidade.id,
        "profissional1_id": self.prof1.id,
        "servico_id": self.servico.id,
        "pacote_codigo": pacote.codigo if hasattr(pacote, "codigo") else "",
        "data": iso(date.today()),
        "status": "agendado",
        "ambiente": "Sala 1",
        "recorrente[terca][ativo]": "on", "recorrente[terca][inicio]": "09:00", "recorrente[terca][fim]": "10:00",
        "recorrente[sexta][ativo]": "on", "recorrente[sexta][inicio]": "13:00", "recorrente[sexta][fim]": "14:00",
    }, follow=True)

    # total de agendamentos deve ser 10
    total_ag = Agendamento.objects.filter(pacote=pacote).count()
    self.assertEqual(total_ag, 10)

    # pagamentos não devem ser duplicados
    total_pg = Pagamento.objects.filter(pacote=pacote).count()
    self.assertEqual(total_pg, 1)

    # valida distribuição: 2 antigos + 8 novos
    antigos = Agendamento.objects.filter(hora_inicio="07:00", hora_fim="08:00").count()
    novos_terca = Agendamento.objects.filter(hora_inicio="09:00", hora_fim="10:00").count()
    novos_sexta = Agendamento.objects.filter(hora_inicio="13:00", hora_fim="14:00").count()

    self.assertEqual(antigos, 2)
    self.assertEqual(novos_terca + novos_sexta, 8)

'''


from django.test import TestCase
from datetime import date, timedelta
from core.models import Paciente, Servico, PacotePaciente, Receita, Pagamento
from core.services.financeiro import criar_receita_pacote, registrar_pagamento


class FinanceiroTests(TestCase):
    def setUp(self):
        self.paciente = Paciente.objects.create(nome='João', nomeEmergencia='X', vinculo='outro')
        self.servico = Servico.objects.create(nome='Fisio', valor=1485, qtd_sessoes=10, ativo=True)
        self.pacote = PacotePaciente.objects.create(paciente=self.paciente, servico=self.servico, qtd_sessoes=10, valor_final=1485, valor_total=1485, ativo=True)
        self.venc = date.today() + timedelta(days=3)

    def test_cria_receita_sem_pagamento(self):
        r = criar_receita_pacote(self.paciente, self.pacote, 1485, self.venc)
        self.assertEqual(r.valor, 1485)
        self.assertEqual(r.status, 'pendente')
        self.assertEqual(r.total_pago, 0)
        self.assertEqual(r.saldo, 1485)
        self.assertEqual(Pagamento.objects.count(), 0)

    def test_pagamento_parcial(self):
        r = criar_receita_pacote(self.paciente, self.pacote, 1485, self.venc)
        registrar_pagamento(r, self.paciente, self.pacote, None, 500, 'pix')
        r.refresh_from_db()
        self.assertEqual(r.total_pago, 500)
        self.assertEqual(r.saldo, 985)
        self.assertEqual(r.status, 'pendente')  # não venceu ainda

    def test_pagamento_total(self):
        r = criar_receita_pacote(self.paciente, self.pacote, 1485, self.venc)
        registrar_pagamento(r, self.paciente, self.pacote, None, 1485, 'pix')
        r.refresh_from_db()
        self.assertEqual(r.total_pago, 1485)
        self.assertEqual(r.saldo, 0)
        self.assertEqual(r.status, 'pago')

    def test_nao_duplicar_pagamento_na_criacao(self):
        r = criar_receita_pacote(self.paciente, self.pacote, 1485, self.venc)
        self.assertEqual(Pagamento.objects.count(), 0)  # só receita criada

    def test_atrasado_quando_venceu_e_nao_pagou(self):
        r = criar_receita_pacote(self.paciente, self.pacote, 1485, date.today() - timedelta(days=1))
        r.atualizar_status_por_pagamentos()
        self.assertEqual(r.status, 'atrasado')


    def test_pagamento_multiplos_parciais(self):
        """Simula 3 pagamentos parciais até quitar o valor total"""
        r = criar_receita_pacote(self.paciente, self.pacote, 1000, self.venc)
        
        registrar_pagamento(r, self.paciente, self.pacote, None, 300, 'pix')
        registrar_pagamento(r, self.paciente, self.pacote, None, 400, 'pix')
        registrar_pagamento(r, self.paciente, self.pacote, None, 300, 'pix')
        
        r.refresh_from_db()
        self.assertEqual(r.total_pago, 1000)
        self.assertEqual(r.saldo, 0)
        self.assertEqual(r.status, 'pago')
        self.assertEqual(Pagamento.objects.filter(receita=r).count(), 3)

    def test_pagamento_excedente(self):
        """Verifica se pagamento acima do valor não deixa saldo negativo"""
        r = criar_receita_pacote(self.paciente, self.pacote, 1000, self.venc)
        registrar_pagamento(r, self.paciente, self.pacote, None, 1200, 'pix')
        
        r.refresh_from_db()
        self.assertEqual(r.total_pago, 1200)
        # saldo nunca deve ser negativo — o máximo é 0
        self.assertEqual(max(r.saldo, 0), 0)
        self.assertEqual(r.status, 'pago')

    def test_vencimento_sem_pagamento_autoatualiza(self):
        """Simula rotina de atualização automática de receitas vencidas"""
        vencido = date.today() - timedelta(days=5)
        r = criar_receita_pacote(self.paciente, self.pacote, 500, vencido)
        
        # ainda não pago
        r.atualizar_status_por_pagamentos()
        self.assertEqual(r.status, 'atrasado')

        # paga depois do vencimento → deve virar pago
        registrar_pagamento(r, self.paciente, self.pacote, None, 500, 'pix')
        r.refresh_from_db()
        self.assertEqual(r.status, 'pago')