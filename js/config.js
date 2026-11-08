// ============================================================
// EntreNós — Configuração
// Estas duas chaves são públicas por natureza. A segurança real
// está nas regras do banco (RLS), já aplicadas no Supabase.
// ============================================================

export const SUPABASE_URL  = 'https://gnzlitxmgkbvxkogjwmq.supabase.co';
export const SUPABASE_CHAVE = 'sb_publishable_vlhJq5oonYachc0K8aUH5A_E90y7Jlm';

// Quantos números tem o PIN
export const TAMANHO_PIN = 4;

// Quantas tentativas erradas antes de bloquear
export const TENTATIVAS_PIN = 5;
