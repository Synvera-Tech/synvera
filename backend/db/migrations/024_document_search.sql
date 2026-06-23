-- Migration 024: Document Search (RAG v0)
--
-- Introduces the document retrieval layer for the Synvera documental search system.
-- This implementation uses PostgreSQL Full Text Search (FTS) with the 'portuguese'
-- dictionary. No embeddings, no vector database, no AI generation.
--
-- Architecture (RAG v0):
--   Query → PostgreSQL FTS → Ranked chunks → Results
--
-- Future RAG v1 path (not implemented here):
--   Query → FTS Retrieval → Context Builder → LLM Provider → Generated Answer
--
-- The Calculation Engine remains the sole source of numerical truth.
-- The document layer is read-only and never influences fee calculations.

-- ---------------------------------------------------------------------------
-- documents: registry of indexed source documents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT        NOT NULL,
    version_label TEXT        NOT NULL,
    document_type TEXT        NOT NULL
        CHECK (document_type IN ('cbhpm', 'sbn_manual', 'spine_manual')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- document_chunks: indexed text segments with FTS vector
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_chunks (
    id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id   UUID    NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number   INT     NOT NULL,
    section_title TEXT,
    chunk_text    TEXT    NOT NULL,
    -- Generated FTS vector: section_title + chunk_text, Portuguese stemming/stopwords.
    -- Stored so GIN index stays consistent without triggers.
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector(
            'portuguese',
            coalesce(section_title, '') || ' ' || chunk_text
        )
    ) STORED,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_search
    ON document_chunks USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id
    ON document_chunks (document_id);

-- ---------------------------------------------------------------------------
-- Seed: representative document records
-- ---------------------------------------------------------------------------
INSERT INTO documents (id, name, version_label, document_type) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'CBHPM',                    '2022',      'cbhpm'),
    ('a0000000-0000-0000-0000-000000000002', 'CBHPM',                    '2025-2026', 'cbhpm'),
    ('a0000000-0000-0000-0000-000000000003', 'Manual SBN Neurocirurgia', '2018',      'sbn_manual'),
    ('a0000000-0000-0000-0000-000000000004', 'Manual Cirurgia de Coluna','3ª ed. 2025','spine_manual')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Seed: representative chunks for immediate search functionality.
-- Full extraction via data/ingest_documents.py populates the complete corpus.
-- ---------------------------------------------------------------------------

-- CBHPM 2022 — Urgência / Emergência
INSERT INTO document_chunks (document_id, page_number, section_title, chunk_text) VALUES
(
    'a0000000-0000-0000-0000-000000000001', 47,
    'Urgência e Emergência',
    'Os procedimentos realizados em caráter de urgência ou emergência em horário especial (das 19h às 7h, aos sábados após as 13h, domingos e feriados) têm acréscimo de 30% sobre o valor total dos honorários médicos. Este adicional aplica-se ao cirurgião principal, auxiliares e anestesista, desde que todos atuem efetivamente no ato cirúrgico em horário de urgência. A comprovação da urgência deve constar no prontuário do paciente.'
),
(
    'a0000000-0000-0000-0000-000000000001', 52,
    'Atos Cirúrgicos Pediátricos',
    'Procedimentos realizados em pacientes pediátricos com peso inferior a 10 kg têm acréscimo de 100% sobre o valor do porte cirúrgico. Para pacientes com peso entre 10 kg e 25 kg, o acréscimo é de 50%. Para recém-nascidos (até 28 dias de vida), o acréscimo é de 150%, independentemente do peso. Estes percentuais aplicam-se ao porte cirúrgico do procedimento principal e não são cumulativos com outros acréscimos pediátricos.'
),
(
    'a0000000-0000-0000-0000-000000000001', 38,
    'Via de Acesso Cirúrgico',
    'Quando o mesmo ato cirúrgico exige duas ou mais vias de acesso distintas, cada via é valorada separadamente conforme a tabela de portes. A via de acesso diferente é cobrada com 70% do valor do porte correspondente. Quando a via de acesso é a mesma do procedimento principal, não há cobrança adicional pela via de acesso. A distinção entre via de acesso "mesma" e "diferente" é determinada pela anatomia cirúrgica, não pela lateralidade.'
),
(
    'a0000000-0000-0000-0000-000000000001', 61,
    'Auxiliares em Atos Cirúrgicos',
    'O número de auxiliares autorizados varia conforme a complexidade do procedimento e o porte cirúrgico. Procedimentos de porte 7 a 10 permitem até 3 auxiliares. Procedimentos de porte 1 a 6 permitem até 2 auxiliares. Cada auxiliar recebe 30% do valor do porte do cirurgião principal. A anestesia, quando necessária, é remunerada separadamente conforme cálculo específico de USC (Unidade de Serviço de Anestesia).'
),
-- CBHPM 2025-2026 — Valores atualizados
(
    'a0000000-0000-0000-0000-000000000002', 8,
    'Reajuste INPC 2025-2026',
    'O Comunicado CFM/AMB estabelece reajuste de 5,10% sobre os valores da CBHPM 2022, com vigência a partir de janeiro de 2025. Os valores dos portes foram atualizados proporcionalmente. Porte 1A: R$ 38,71. Porte 2A: R$ 77,42. Porte 3A: R$ 116,13. Porte 4A: R$ 154,84. Portes de Porte Anestésico (PA) seguem tabela específica com os mesmos percentuais de reajuste. O reajuste aplica-se a todos os procedimentos indexados à tabela CBHPM.'
),
(
    'a0000000-0000-0000-0000-000000000002', 12,
    'Múltiplos Procedimentos',
    'Quando realizados múltiplos procedimentos na mesma sessão cirúrgica, o procedimento principal é remunerado com 100% do valor. O segundo procedimento recebe 70% do valor. O terceiro e demais procedimentos recebem 50% do valor cada um. Esta regra aplica-se independentemente da via de acesso, salvo quando a CBHPM especifica regra específica para o procedimento. Procedimentos de porte diferente devem ser ordenados do maior para o menor.'
),
-- SBN Manual Neurocirurgia 2018
(
    'a0000000-0000-0000-0000-000000000003', 23,
    'Craniotomia Descompressiva',
    'A craniotomia descompressiva (código SBN 3.02.15.02-1, CBHPM porte 9C) é indicada para hipertensão intracraniana refratária ao tratamento clínico. A composição CBHPM inclui obrigatoriamente a craniectomia como código principal. Procedimentos associados como drenagem de hematoma subdural e monitorização da pressão intracraniana são codificados separadamente com seus respectivos portes. O número máximo de auxiliares autorizados para procedimentos de porte 9C é 3.'
),
(
    'a0000000-0000-0000-0000-000000000003', 41,
    'Aneurisma Cerebral',
    'O tratamento cirúrgico de aneurisma cerebral compreende dois códigos principais conforme a técnica: clipagem microcirúrgica (porte 10C) e exclusão endovascular (porte 9A). A clipagem de aneurisma gigante (diâmetro > 25mm) possui adicional de 50% sobre o porte base. A monitorização neurofisiológica intraoperatória é codificada separadamente. Procedimentos de abordagem bilateral realizados na mesma sessão seguem a regra de múltiplos procedimentos.'
),
(
    'a0000000-0000-0000-0000-000000000003', 67,
    'Composição de Procedimentos Neurocirúrgicos',
    'A composição CBHPM para procedimentos neurocirúrgicos segue hierarquia: procedimento principal (100%), procedimentos acessórios por via de acesso diferente (70%), procedimentos complementares (50%). A pesquisa do código SBN no Manual de Diretrizes identifica os códigos CBHPM correspondentes ao procedimento. Cada código SBN mapeia para um conjunto específico de códigos CBHPM com seus respectivos portes e regras de cobrança.'
),
-- Manual Cirurgia de Coluna 3ª ed. 2025
(
    'a0000000-0000-0000-0000-000000000004', 18,
    'Artrodese Cervical',
    'A artrodese cervical anterior (ACDF — Anterior Cervical Discectomy and Fusion) é codificada pelo número de segmentos operados. O código base aplica-se ao primeiro segmento e os segmentos adicionais são multiplicadores do valor. Artrodese de C3-C4 a C6-C7 pode incluir até 4 segmentos. A colocação de cage intersomático e instrumentação com placa são componentes do mesmo código e não devem ser cobrados separadamente, salvo especificação expressa da CBHPM.'
),
(
    'a0000000-0000-0000-0000-000000000004', 34,
    'Múltiplos Segmentos em Cirurgia de Coluna',
    'Procedimentos de coluna com envolvimento de múltiplos segmentos vertebrais têm o valor final multiplicado pelo número de segmentos tratados, conforme especificado no Manual SBN Coluna 3ª edição. A regra aplica-se à infiltração foraminal/facetária (4.08.13.36-3), denervação percutânea (3.14.03.33-6) e artroplastia discal (3.07.15.59-8). O laudo cirúrgico deve especificar claramente os segmentos tratados para justificar a cobrança por nível vertebral.'
),
(
    'a0000000-0000-0000-0000-000000000004', 52,
    'Infiltração e Bloqueio em Coluna',
    'O bloqueio de nervo periférico e a infiltração foraminal/facetária são cobrados por segmento corporal tratado. Procedimentos bilaterais (direito e esquerdo no mesmo nível) são autorizados quando a indicação clínica está documentada. O código 4.08.13.36-3 (infiltração foraminal/facetária) permite cobrança bilateral com lateralidade explicitada no laudo. A radiofrequência facetária (3.14.03.33-6) segue as mesmas regras de lateralidade e número de segmentos.'
);
