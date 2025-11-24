import os
from pathlib import Path

class ContadorLinhas:
    def __init__(self, diretorio='.'):
        self.diretorio = Path(diretorio)
        self.extensoes = {
            'Python': ['.py'],
            'Templates Django': ['.html', '.htm'],
            'JavaScript': ['.js'],
            'CSS': ['.css'],
            'JSON': ['.json'],
            'Markdown': ['.md'],
            'Text': ['.txt'],
        }
        
        self.ignorar_pastas = {
            'venv', '__pycache__', 'migrations', 'node_modules', 
            '.git', 'staticfiles', 'media', '.vscode', '.idea'
        }
        
        self.ignorar_arquivos = {
            'package-lock.json', 'yarn.lock'
        }
    
    def contar_linhas_arquivo(self, arquivo):
        """Conta linhas em um arquivo, ignorando linhas vazias se desejar"""
        try:
            with open(arquivo, 'r', encoding='utf-8', errors='ignore') as f:
                linhas = f.readlines()
                
            # Linhas totais
            total = len(linhas)
            
            # Linhas não vazias (opcional)
            nao_vazias = len([linha for linha in linhas if linha.strip()])
            
            return total, nao_vazias
            
        except Exception as e:
            print(f"Erro ao ler {arquivo}: {e}")
            return 0, 0
    
    def analisar_projeto(self):
        resultados = {}
        total_linhas = 0
        total_nao_vazias = 0
        total_arquivos = 0
        
        for tipo, extensoes in self.extensoes.items():
            linhas_tipo = 0
            linhas_nao_vazias_tipo = 0
            arquivos_tipo = 0
            
            for arquivo in self.diretorio.rglob('*'):
                # Ignorar pastas
                if any(part in self.ignorar_pastas for part in arquivo.parts):
                    continue
                    
                # Ignorar arquivos específicos
                if arquivo.name in self.ignorar_arquivos:
                    continue
                
                if arquivo.is_file() and arquivo.suffix.lower() in extensoes:
                    linhas, nao_vazias = self.contar_linhas_arquivo(arquivo)
                    linhas_tipo += linhas
                    linhas_nao_vazias_tipo += nao_vazias
                    arquivos_tipo += 1
            
            resultados[tipo] = {
                'linhas': linhas_tipo,
                'nao_vazias': linhas_nao_vazias_tipo,
                'arquivos': arquivos_tipo
            }
            
            total_linhas += linhas_tipo
            total_nao_vazias += linhas_nao_vazias_tipo
            total_arquivos += arquivos_tipo
        
        return resultados, total_linhas, total_nao_vazias, total_arquivos
    
    def gerar_relatorio(self):
        resultados, total, total_nao_vazias, total_arquivos = self.analisar_projeto()
        
        print("=" * 60)
        print("RELATÓRIO COMPLETO DO PROJETO")
        print("=" * 60)
        print(f"Diretório: {self.diretorio.absolute()}")
        print("-" * 60)
        
        for tipo, dados in resultados.items():
            if dados['arquivos'] > 0:
                print(f"{tipo:18} | {dados['linhas']:6} linhas | "
                      f"{dados['nao_vazias']:6} não vazias | {dados['arquivos']:3} arquivos")
        
        print("-" * 60)
        print(f"{'TOTAL':18} | {total:6} linhas | {total_nao_vazias:6} não vazias | {total_arquivos:3} arquivos")
        
        # Estatísticas adicionais
        if total > 0:
            percentual_nao_vazias = (total_nao_vazias / total) * 100
            print(f"Linhas de código: {percentual_nao_vazias:.1f}%")
        
        print("=" * 60)

# Uso
if __name__ == "__main__":
    contador = ContadorLinhas()
    contador.gerar_relatorio()