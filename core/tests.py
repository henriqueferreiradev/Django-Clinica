from django.test import TestCase
from datetime import date
from core.models import Paciente, FrequenciaMensal, HistoricoStatus


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
