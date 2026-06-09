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
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbmVjdmZ6Ym9xcWdzcHZiaWJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjI2NDUsImV4cCI6MjA5NjQzODY0NX0.zyrJZ8WVA_d3s9WMPt5LR5WyRHY3zQ6wr5yAZfmz5jQ'
const supabase = createClient(supabaseUrl, supabaseKey)
