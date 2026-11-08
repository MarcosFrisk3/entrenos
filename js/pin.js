// ============================================================
// EntreNós — PIN
//
// O PIN nunca sai deste aparelho e nunca vai para o servidor.
// Guardamos só um "resumo" embaralhado (hash), impossível de reverter.
// ============================================================

import { TENTATIVAS_PIN } from './config.js';

const CHAVE_PIN   = 'entrenos.pin';
const CHAVE_SAL   = 'entrenos.sal';
const CHAVE_ERROS = 'entrenos.erros';
const CHAVE_PRESO = 'entrenos.bloqueado_ate';


export function temPin() {
  return !!localStorage.getItem(CHAVE_PIN);
}

export async function definirPin(pin) {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const resumo = await embaralhar(pin, sal);
  localStorage.setItem(CHAVE_SAL, paraTexto(sal));
  localStorage.setItem(CHAVE_PIN, resumo);
  zerarErros();
}

export async function conferirPin(pin) {
  const salvo = localStorage.getItem(CHAVE_PIN);
  const sal   = localStorage.getItem(CHAVE_SAL);
  if (!salvo || !sal) return false;

  const resumo = await embaralhar(pin, paraBytes(sal));
  const certo  = igual(resumo, salvo);

  if (certo) zerarErros();
  else contarErro();

  return certo;
}

export function apagarPin() {
  localStorage.removeItem(CHAVE_PIN);
  localStorage.removeItem(CHAVE_SAL);
  zerarErros();
}


// ---------- Bloqueio por tentativas ----------
export function segundosBloqueado() {
  const ate = Number(localStorage.getItem(CHAVE_PRESO) || 0);
  const falta = Math.ceil((ate - Date.now()) / 1000);
  return falta > 0 ? falta : 0;
}

export function tentativasRestantes() {
  const erros = Number(localStorage.getItem(CHAVE_ERROS) || 0);
  return Math.max(0, TENTATIVAS_PIN - erros);
}

function contarErro() {
  const erros = Number(localStorage.getItem(CHAVE_ERROS) || 0) + 1;
  localStorage.setItem(CHAVE_ERROS, String(erros));
  if (erros >= TENTATIVAS_PIN) {
    // Bloqueia por 1 minuto, dobrando a cada rodada
    const rodadas = Math.floor(erros / TENTATIVAS_PIN);
    const minutos = Math.min(30, 2 ** (rodadas - 1));
    localStorage.setItem(CHAVE_PRESO, String(Date.now() + minutos * 60000));
  }
}

function zerarErros() {
  localStorage.removeItem(CHAVE_ERROS);
  localStorage.removeItem(CHAVE_PRESO);
}


// ---------- Embaralhamento (PBKDF2) ----------
async function embaralhar(pin, sal) {
  const base = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: sal, iterations: 150000, hash: 'SHA-256' },
    base, 256
  );
  return paraTexto(new Uint8Array(bits));
}

function paraTexto(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function paraBytes(texto) {
  const saida = new Uint8Array(texto.length / 2);
  for (let i = 0; i < saida.length; i++) {
    saida[i] = parseInt(texto.substr(i * 2, 2), 16);
  }
  return saida;
}

// Comparação que leva sempre o mesmo tempo
function igual(a, b) {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}
