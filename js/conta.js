// ============================================================
// EntreNós — Conta (login, cadastro, vínculo do casal)
//
// Tudo o que fala com o Supabase está neste arquivo.
// Quando o app virar nativo (lojas), só este arquivo muda.
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_CHAVE } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_CHAVE, {
  auth: { persistSession: true, autoRefreshToken: true }
});


// ---------- Cadastro ----------
export async function criarConta(email, senha, apelido) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { apelido: apelido || 'Amor', maior_idade: true },
      emailRedirectTo: window.location.origin + window.location.pathname
    }
  });
  if (error) throw new Error(traduzir(error.message));
  return data;
}


// ---------- Entrar ----------
export async function entrar(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) throw new Error(traduzir(error.message));
  return data;
}


// ---------- Sair ----------
export async function sair() {
  await supabase.auth.signOut();
}


// ---------- Recuperar senha ----------
export async function recuperarSenha(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname
  });
  if (error) throw new Error(traduzir(error.message));
}


// ---------- Quem está logado ----------
export async function sessaoAtual() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}


// ---------- Situação do casal ----------
export async function buscarStatus() {
  const { data, error } = await supabase.rpc('meu_status');
  if (error) throw new Error('Não consegui falar com o servidor.');
  return data;
}


// ---------- Meu apelido ----------
export async function meuApelido() {
  const sessao = await sessaoAtual();
  if (!sessao) return 'Amor';
  const { data } = await supabase
    .from('perfis').select('apelido').eq('id', sessao.user.id).single();
  return data?.apelido || 'Amor';
}


// ---------- Convite ----------
export async function gerarConvite() {
  const { data, error } = await supabase.rpc('criar_convite');
  if (error) throw new Error('Não consegui gerar o código.');
  if (!data.ok) throw new Error(data.erro);
  return data;
}

export async function usarConvite(codigo) {
  const { data, error } = await supabase.rpc('aceitar_convite', { p_codigo: codigo });
  if (error) throw new Error('Não consegui validar o código.');
  if (!data.ok) throw new Error(data.erro);
  return data;
}

export async function desfazerVinculo() {
  const { data, error } = await supabase.rpc('desfazer_vinculo');
  if (error) throw new Error('Não consegui desfazer o vínculo.');
  if (!data.ok) throw new Error(data.erro);
  return data;
}


// ---------- Mensagens de erro em português ----------
function traduzir(msg = '') {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('email not confirmed'))       return 'Confirme seu e-mail antes de entrar.';
  if (m.includes('user already registered'))   return 'Esse e-mail já tem conta. Use "Entrar".';
  if (m.includes('password should be'))        return 'A senha precisa de pelo menos 8 caracteres.';
  if (m.includes('unable to validate email'))  return 'E-mail inválido.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas. Espere um minuto.';
  if (m.includes('network') || m.includes('fetch')) return 'Sem conexão com a internet.';
  return 'Algo deu errado. Tente de novo.';
}
