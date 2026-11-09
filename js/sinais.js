// ============================================================
// EntreNós — Sinais
//
// Tudo o que fala com o servidor sobre sinais e respostas.
// ============================================================

import { supabase, sessaoAtual } from './conta.js';

let canal = null;


// ---------- Enviar ----------
export async function enviarSinal({ casalId, tom, desejo, texto }) {
  const sessao = await sessaoAtual();
  if (!sessao) throw new Error('Entre na sua conta de novo.');

  const { data, error } = await supabase
    .from('sinais')
    .insert({
      casal_id: casalId,
      remetente: sessao.user.id,
      tom,
      desejo: desejo || null,
      texto: texto.trim().slice(0, 500)
    })
    .select()
    .single();

  if (error) throw new Error('Não consegui enviar. Tente de novo.');
  return data;
}


// ---------- Últimos sinais ----------
export async function listarSinais(quantos = 20) {
  const { data, error } = await supabase
    .from('sinais')
    .select('*, respostas(*)')
    .order('criado_em', { ascending: false })
    .limit(quantos);

  if (error) throw new Error('Não consegui carregar os sinais.');
  return data || [];
}


// ---------- Sinal novo esperando por mim ----------
export async function sinalNaoVisto() {
  const sessao = await sessaoAtual();
  if (!sessao) return null;

  const { data } = await supabase
    .from('sinais')
    .select('*')
    .is('visto_em', null)
    .neq('remetente', sessao.user.id)
    .order('criado_em', { ascending: false })
    .limit(1);

  return (data && data[0]) || null;
}


// ---------- Marcar como visto ----------
export async function marcarVisto(sinalId) {
  const { error } = await supabase.rpc('marcar_visto', { p_sinal_id: sinalId });
  if (error) throw new Error('Não consegui marcar como visto.');
}


// ---------- Responder ----------
export async function responder(sinalId, texto) {
  const sessao = await sessaoAtual();
  if (!sessao) throw new Error('Entre na sua conta de novo.');

  const { data, error } = await supabase
    .from('respostas')
    .insert({
      sinal_id: sinalId,
      autor: sessao.user.id,
      texto: texto.trim().slice(0, 300)
    })
    .select()
    .single();

  if (error) throw new Error('Não consegui enviar a resposta.');
  return data;
}


// ---------- Tempo real ----------
// Avisa na hora quando chega um sinal ou uma resposta.
export async function ouvir({ aoChegarSinal, aoChegarResposta }) {
  const sessao = await sessaoAtual();
  if (!sessao) return;

  pararDeOuvir();

  canal = supabase
    .channel('entrenos')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'sinais' },
      (ev) => {
        if (ev.new.remetente !== sessao.user.id) aoChegarSinal?.(ev.new);
      })
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'respostas' },
      (ev) => {
        if (ev.new.autor !== sessao.user.id) aoChegarResposta?.(ev.new);
      })
    .subscribe();
}

export function pararDeOuvir() {
  if (canal) { supabase.removeChannel(canal); canal = null; }
}
