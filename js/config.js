// ============================================================
// SANEAMENTO E SPCI — Configuração do Supabase
// PREENCHA COM AS SUAS CREDENCIAIS DO PROJETO SUPABASE
// ============================================================
//
// Como obter estas informações:
// 1. Acesse https://supabase.com e entre no seu projeto
// 2. Vá em Settings > API
// 3. Copie a "Project URL" e a "anon public" key
//

import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://llnecvfzboqqgspvbibg.supabase.co/rest/v1/'
const supabaseKey = 'sb_publishable_b8LkKFq6_pKoMsPbXzguoA_VAbpZIT4'
const supabase = createClient(supabaseUrl, supabaseKey)
