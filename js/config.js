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

// Remove o import ES6 e usa script tag do CDN em seu lugar

const SUPABASE_URL = 'https://llnecvfzboqqgspvbibg.supabase.co'
const SUPABASE_ANON = 'sb_publishable_b8LkKFq6_pKoMsPbXzguoA_VAbpZIT4'

// Define no window para garantir acesso global
window.SUPABASE_URL = SUPABASE_URL
window.SUPABASE_ANON = SUPABASE_ANON
