import json
import re
import pdfplumber
from typing import List, Dict, Optional

class AfereETL:
    """
    Script de Extração e Cálculo para o Afere (LabF5).
    Versão definitiva com importação global de dependências e caminhos relativos ao monorepo.
    """

    def __init__(self, sbn_pdf_path: str, comunicado_pdf_path: str, spine_pdf_path: str = None):
        self.sbn_pdf_path = sbn_pdf_path
        self.comunicado_pdf_path = comunicado_pdf_path
        self.spine_pdf_path = spine_pdf_path
        self.procedimentos: List[Dict] = []
        self.procedimentos_coluna: List[Dict] = []
        self.valores_portes: Dict[str, float] = {}

    def extrair_dados_sbn(self):
        print(f"A extrair dados de {self.sbn_pdf_path}...")
        procedimento_atual = None
        
        with pdfplumber.open(self.sbn_pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if not text:
                    continue
                
                linhas = text.split('\n')
                for linha in linhas:
                    match_nome = re.search(r'Nome Procedimento\s+(.+)', linha, re.IGNORECASE)
                    if match_nome:
                        if procedimento_atual:
                            self.procedimentos.append(procedimento_atual)
                        
                        procedimento_atual = {
                            "nome": match_nome.group(1).strip(),
                            "codigos_cbhpm": []
                        }
                    
                    match_codigo = re.search(r'(\d\.\d{2}\.\d{2}\.\d{2}\-\d)\s+(.+?)\s+(\d{1,2}[A-C])', linha)
                    if match_codigo and procedimento_atual:
                        procedimento_atual["codigos_cbhpm"].append({
                            "codigo": match_codigo.group(1),
                            "descricao": match_codigo.group(2).strip(),
                            "porte": match_codigo.group(3)
                        })
        
        if procedimento_atual:
            self.procedimentos.append(procedimento_atual)
            
        print(f"Total de {len(self.procedimentos)} procedimentos extraídos da SBN.")

    def extrair_valores_comunicado(self):
        print(f"A extrair valores de {self.comunicado_pdf_path}...")
        with pdfplumber.open(self.comunicado_pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if not text:
                    continue

                matches = re.finditer(r'(\d{1,2}[A-C])\s+R\$\s+([\d\.]+,(?:\d{2}))', text)
                for match in matches:
                    porte = match.group(1)
                    valor_str = match.group(2).replace('.', '').replace(',', '.')
                    if porte not in self.valores_portes:
                        self.valores_portes[porte] = float(valor_str)

        print(f"Valores de portes mapeados: {len(self.valores_portes)}")

    def extrair_dados_coluna(self):
        """Extrai procedimentos específicos de cirurgia da coluna vertebral."""
        if not self.spine_pdf_path:
            print("Caminho PDF de coluna vertebral não fornecido.")
            return

        print(f"A extrair procedimentos de coluna de {self.spine_pdf_path}...")

        with pdfplumber.open(self.spine_pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if not text:
                    continue

                # Match pattern: CBHPM code followed by procedure description
                # Example: 3.07.15.28-8: Substituição de corpo vertebral – description
                matches = re.finditer(
                    r'(\d\.\d{2}\.\d{2}\.\d{2}-\d):\s*(.+?)(?:\n|$)',
                    text,
                    re.MULTILINE
                )

                for match in matches:
                    codigo = match.group(1)
                    descricao_raw = match.group(2).strip()

                    # Extrair nome do procedimento (texto antes do dash)
                    nome_match = re.match(r'^([^–\-]+?)(?:\s*[–\-]|$)', descricao_raw)
                    nome = nome_match.group(1).strip() if nome_match else descricao_raw[:50]

                    # Descartar duplicatas por código
                    if not any(p['codigo'] == codigo for p in self.procedimentos_coluna):
                        self.procedimentos_coluna.append({
                            "codigo": codigo,
                            "nome": nome,
                            "descricao": descricao_raw[:100],
                            "especialidade": "Coluna Vertebral"
                        })

        print(f"Total de {len(self.procedimentos_coluna)} procedimentos de coluna extraídos.")

    def gerar_sql_insercao(self, output_path: str):
        """
        Gera um ficheiro SQL otimizado para popular o PostgreSQL (Neon).
        Inclui tanto procedimentos gerais como procedimentos específicos de coluna.
        """
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("-- Estrutura e Inserção de Dados - Afere\n\n")
            f.write("CREATE TABLE IF NOT EXISTS portes_valores (\n")
            f.write("    porte VARCHAR(5) PRIMARY KEY,\n")
            f.write("    valor NUMERIC(10, 2) NOT NULL\n")
            f.write(");\n\n")

            f.write("CREATE TABLE IF NOT EXISTS procedimentos (\n")
            f.write("    id SERIAL PRIMARY KEY,\n")
            f.write("    nome VARCHAR(255) NOT NULL,\n")
            f.write("    especialidade VARCHAR(100)\n")
            f.write(");\n\n")

            f.write("CREATE TABLE IF NOT EXISTS procedimentos_cbhpm (\n")
            f.write("    codigo VARCHAR(20) PRIMARY KEY,\n")
            f.write("    procedimento_id INTEGER REFERENCES procedimentos(id),\n")
            f.write("    descricao TEXT NOT NULL,\n")
            f.write("    porte VARCHAR(5) REFERENCES portes_valores(porte)\n")
            f.write(");\n\n")

            # Inserir Portes
            f.write("-- Inserindo Valores dos Portes\n")
            for porte, valor in self.valores_portes.items():
                f.write(f"INSERT INTO portes_valores (porte, valor) VALUES ('{porte}', {valor}) ON CONFLICT DO NOTHING;\n")

            # Inserir Procedimentos gerais
            f.write("\n-- Inserindo Procedimentos Gerais de Neurocirurgia\n")
            idx = 1
            for proc in self.procedimentos:
                nome_limpo = proc['nome'].replace("'", "''")
                f.write(f"INSERT INTO procedimentos (id, nome, especialidade) VALUES ({idx}, '{nome_limpo}', 'Neurocirurgia') ON CONFLICT DO NOTHING;\n")

                for cbhpm in proc['codigos_cbhpm']:
                    desc_limpa = cbhpm['descricao'].replace("'", "''")
                    codigo = cbhpm['codigo']
                    porte = cbhpm['porte']
                    f.write(f"INSERT INTO procedimentos_cbhpm (codigo, procedimento_id, descricao, porte) ")
                    f.write(f"VALUES ('{codigo}', {idx}, '{desc_limpa}', '{porte}') ON CONFLICT DO NOTHING;\n")
                idx += 1

            # Inserir Procedimentos de Coluna Vertebral
            if self.procedimentos_coluna:
                f.write("\n-- Inserindo Procedimentos Específicos de Coluna Vertebral\n")
                for proc in self.procedimentos_coluna:
                    nome_limpo = proc['nome'].replace("'", "''")
                    desc_limpa = proc['descricao'].replace("'", "''")
                    codigo = proc['codigo']
                    especialidade = proc['especialidade']

                    f.write(f"INSERT INTO procedimentos (nome, especialidade) VALUES ('{nome_limpo}', '{especialidade}') ")
                    f.write(f"ON CONFLICT DO NOTHING;\n")
                    f.write(f"INSERT INTO procedimentos_cbhpm (codigo, descricao) ")
                    f.write(f"VALUES ('{codigo}', '{desc_limpa}') ON CONFLICT DO NOTHING;\n")

        print(f"Ficheiro SQL gerado com sucesso em: {output_path}")

if __name__ == '__main__':
    # O script está dentro de 'data/', então ele deve procurar na subpasta 'raw_pdfs/'
    etl = AfereETL(
        'raw_pdfs/Manual_De_Diretrizes_De_Codificacao_Dos_Procedimentos_Em_Neurocirurgia-2018.pdf',
        'raw_pdfs/COMUNICADO-CBHPM-2025_2026.pdf',
        'raw_pdfs/Manual_De_Diretrizes_De_Codificacao_Em_Cirurgia_De_Coluna_Vertebral-3ed-2025.pdf'
    )

    # Descomente para rodar a extração em ambiente de desenvolvimento
    etl.extrair_dados_sbn()
    etl.extrair_valores_comunicado()
    if etl.spine_pdf_path:
        etl.extrair_dados_coluna()

    # Gera o SQL diretamente na pasta do backend para o sqlc/migrate consumir
    etl.gerar_sql_insercao('../backend/db/schema.sql')