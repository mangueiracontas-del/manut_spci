-- ============================================================
-- SANEAMENTO E SPCI — Setup do Banco de Dados Supabase
-- Execute este script no SQL Editor do seu projeto Supabase
-- ============================================================

-- 1. TABELA PRINCIPAL DE DEMANDAS
CREATE TABLE IF NOT EXISTS demandas (
  id            TEXT PRIMARY KEY,
  data          DATE NOT NULL,
  data_hora     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  site          TEXT NOT NULL,
  local         TEXT NOT NULL,
  tag           TEXT NOT NULL,
  solicitante   TEXT NOT NULL,
  situacao      TEXT NOT NULL,
  descricao     TEXT NOT NULL,
  foto          TEXT,                    -- base64 da imagem
  status        TEXT NOT NULL DEFAULT 'Aberta',
  prioridade    TEXT,
  equipe        TEXT,
  comentario_plan TEXT,
  analise       TEXT,
  resolucao     TEXT,
  om            TEXT,
  tecnico       TEXT,
  data_aceite   DATE,
  data_conclusao DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE CONFIGURAÇÕES (senhas hasheadas)
CREATE TABLE IF NOT EXISTS config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 3. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_demandas_status   ON demandas(status);
CREATE INDEX IF NOT EXISTS idx_demandas_site     ON demandas(site);
CREATE INDEX IF NOT EXISTS idx_demandas_data     ON demandas(data DESC);
CREATE INDEX IF NOT EXISTS idx_demandas_equipe   ON demandas(equipe);
CREATE INDEX IF NOT EXISTS idx_demandas_prioridade ON demandas(prioridade);

-- 4. TRIGGER PARA ATUALIZAR updated_at AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_demandas_updated_at ON demandas;
CREATE TRIGGER trg_demandas_updated_at
  BEFORE UPDATE ON demandas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. ROW LEVEL SECURITY (RLS) — Acesso público de leitura/escrita
--    Ajuste conforme necessidade de segurança do seu ambiente
ALTER TABLE demandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE config   ENABLE ROW LEVEL SECURITY;

-- Permite leitura pública das demandas
CREATE POLICY "demandas_select_public"
  ON demandas FOR SELECT USING (true);

-- Permite inserção pública
CREATE POLICY "demandas_insert_public"
  ON demandas FOR INSERT WITH CHECK (true);

-- Permite atualização pública
CREATE POLICY "demandas_update_public"
  ON demandas FOR UPDATE USING (true);

-- Permite exclusão pública (somente planejamento no app)
CREATE POLICY "demandas_delete_public"
  ON demandas FOR DELETE USING (true);

-- Config: leitura e escrita pública
CREATE POLICY "config_all_public"
  ON config FOR ALL USING (true);

-- 6. DADOS DE EXEMPLO (opcional — remova se não quiser)
INSERT INTO demandas (id,data,data_hora,site,local,tag,solicitante,situacao,descricao,status,prioridade,equipe,comentario_plan,analise,resolucao,om,tecnico,data_aceite,data_conclusao)
VALUES
  ('DM-202506-1001','2025-06-01','2025-06-01T08:30:00Z','ETE Norte','Blower A — Sala 01','BLW-001','Carlos Andrade','Sistema parado - Crítico','Blower A não liga após falha elétrica. Alarme no painel indicando sobrecorrente.','Em Andamento','P1','Manutenção Corretiva','Verificar capacitores e disjuntores antes de qualquer intervenção.','Capacitor do motor queimado.','Troca do capacitor 40µF. Motor religado e testado.','OM-2025-0041','João Silva','2025-06-01',NULL),
  ('DM-202506-1002','2025-06-03','2025-06-03T10:15:00Z','ETE Sul','Decantador 02','DEC-002','Maria Santos','Sistema com Restrição - Moderado','Raspador do decantador com ruído anormal. Vibração excessiva.','Em Análise','P3','Inspeção',NULL,NULL,NULL,NULL,NULL,'2025-06-03',NULL),
  ('DM-202506-1003','2025-06-05','2025-06-05T14:00:00Z','ETE Norte','Bomba de Recirculação','BBA-003','Pedro Lima','Sistema parcialmente parado - Prioritário','Bomba com vazamento no selo mecânico. Operando com 50% da capacidade.','Aberta',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
  ('DM-202505-1004','2025-05-20','2025-05-20T09:00:00Z','SPCI Oeste','Painel Elétrico Principal','PAI-001','Ana Costa','Sistema operando - Leve','Disjuntor do quadro 03 disparando intermitentemente sem carga.','Concluída','P2','Manutenção Corretiva','Urgente — pode causar parada geral.','Disjuntor com defeito interno.','Substituição do disjuntor 32A.','OM-2025-0038','Roberto Mendes','2025-05-20','2025-05-22'),
  ('DM-202506-1005','2025-06-10','2025-06-10T07:45:00Z','ETE Sul','Filtro Biológico 01','FIL-001','Carlos Andrade','Sistema parado - Crítico','Motor do distribuidor do filtro biológico queimado. Sistema parado.','Em Andamento','P0','Manutenção Corretiva','URGENTE — acionar supervisor imediatamente.',NULL,NULL,'OM-2025-0045','João Silva','2025-06-10',NULL)
ON CONFLICT (id) DO NOTHING;
