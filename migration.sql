-- ============================================================
-- MIGRAÇÃO: Converter datas de YYYY-MM-DD → DD/MM/AAAA
-- Execute no SQL Editor do Supabase APÓS alterar os tipos
-- ============================================================

-- 1. Alterar tipo das colunas de DATE para TEXT
ALTER TABLE demandas ALTER COLUMN data TYPE TEXT;
ALTER TABLE demandas ALTER COLUMN data_aceite TYPE TEXT;
ALTER TABLE demandas ALTER COLUMN data_conclusao TYPE TEXT;

-- 2. Converter registros existentes (YYYY-MM-DD → DD/MM/AAAA)
UPDATE demandas
SET data = TO_CHAR(data::DATE, 'DD/MM/YYYY')
WHERE data ~ '^\d{4}-\d{2}-\d{2}$';

UPDATE demandas
SET data_aceite = TO_CHAR(data_aceite::DATE, 'DD/MM/YYYY')
WHERE data_aceite ~ '^\d{4}-\d{2}-\d{2}$';

UPDATE demandas
SET data_conclusao = TO_CHAR(data_conclusao::DATE, 'DD/MM/YYYY')
WHERE data_conclusao ~ '^\d{4}-\d{2}-\d{2}$';

-- 3. Verificação (opcional)
-- SELECT id, data, data_aceite, data_conclusao FROM demandas LIMIT 10;
