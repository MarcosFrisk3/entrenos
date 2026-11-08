// ============================================================
// EntreNós — Aplicativo
// ============================================================

import { TAMANHO_PIN } from './config.js';
import * as Conta from './conta.js';
import * as Pin from './pin.js';

const $ = (id) => document.getElementById(id);

let modoCadastro = false;
let statusCasal  = null;
let relogioEspera = null;
let pinNovo = '';
let pinDigitado = '';
let etapaPin = 'criar';   // criar | repetir
let trocandoPin = false;
let passoTour = 1;


// ------------------------------------------------------------
// Telas
// ------------------------------------------------------------
function mostrar(idTela) {
  document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
  $(idTela).classList.add('ativa');
}

function recado(texto) {
  const el = $('recado');
  el.textContent = texto;
  el.classList.add('aparece');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('aparece'), 3000);
}

function aviso(id, texto, ok = false) {
  const el = $(id);
  el.textContent = texto;
  el.classList.toggle('ok', ok);
}

function vibrar(ms = 12) {
  if (navigator.vibrate) navigator.vibrate(ms);
}


// ------------------------------------------------------------
// Início
// ------------------------------------------------------------
async function iniciar() {
  montarTeclado('teclado-criar', aoDigitarCriar);
  montarTeclado('teclado-pin',   aoDigitarPin);
  ligarEventos();

  await new Promise(r => setTimeout(r, 900)); // respira na tela de abertura

  try {
    const sessao = await Conta.sessaoAtual();
    if (!sessao) return mostrar('tela-entrada');
    await seguirDepoisDoLogin();
  } catch {
    mostrar('tela-entrada');
    aviso('aviso-entrada', 'Sem conexão. Tente de novo.');
  }
}

async function seguirDepoisDoLogin() {
  statusCasal = await Conta.buscarStatus();

  if (statusCasal.vinculado) pararVigia();
  else if (statusCasal.aguardando) vigiarVinculo();

  // Primeira vez: mostra o tour antes de qualquer coisa
  if (!statusCasal.vinculado && !localStorage.getItem('entrenos.tour')) {
    passoTour = 1;
    desenharTour();
    return mostrar('tela-tour');
  }

  if (!Pin.temPin()) {
    etapaPin = 'criar'; pinNovo = ''; pinDigitado = '';
    atualizarPontos('pontos-criar', 0);
    $('titulo-criar-pin').textContent = 'Crie seu PIN';
    $('texto-criar-pin').textContent  = 'Quatro números para abrir o app. Fica só neste aparelho.';
    aviso('aviso-criar-pin', '');
    return mostrar('tela-criar-pin');
  }

  pedirPin();
}


// ------------------------------------------------------------
// Tour
// ------------------------------------------------------------
function desenharTour() {
  document.querySelectorAll('.tour-passo').forEach(p =>
    p.classList.toggle('ativo', Number(p.dataset.passo) === passoTour));
  $('tour-pontos').querySelectorAll('i').forEach((p, i) =>
    p.classList.toggle('cheio', i < passoTour));
  $('botao-tour').textContent = passoTour === 3 ? 'Começar' : 'Continuar';
  $('botao-pular-tour').classList.toggle('escondido', passoTour === 3);
}

async function avancarTour() {
  if (passoTour < 3) { passoTour++; return desenharTour(); }
  await terminarTour();
}

async function terminarTour() {
  localStorage.setItem('entrenos.tour', '1');
  await seguirDepoisDoLogin();
}

function pedirPin() {
  pinDigitado = '';
  atualizarPontos('pontos-pin', 0);
  const preso = Pin.segundosBloqueado();
  aviso('aviso-pin', preso ? `Espere ${preso}s para tentar de novo.` : '');
  mostrar('tela-pin');
}

async function abrirApp() {
  const apelido = await Conta.meuApelido();
  const juntos  = !!statusCasal?.vinculado;

  $('saudacao').textContent        = `Olá, ${apelido}`;
  $('ajuste-apelido').textContent  = apelido;
  $('ajuste-parceiro').textContent = juntos ? (statusCasal.parceiro || 'Amor') : 'Ainda não vinculado';
  $('ajuste-plano').textContent    = statusCasal?.plano === 'premium' ? 'Premium' : 'Gratuito';

  // Modo sozinho: faixa de convite e botões ajustados
  $('faixa-convite').classList.toggle('escondido', juntos);
  $('botao-convidar-ajustes').classList.toggle('escondido', juntos);
  $('botao-desvincular').classList.toggle('escondido', !juntos);

  if (!juntos && statusCasal?.aguardando) {
    $('faixa-convite').querySelector('small').textContent = 'Esperando seu amor entrar com o código';
    vigiarVinculo();
  }

  mostrar('tela-principal');
}

function abrirConvite() {
  $('botao-voltar-vinculo').classList.remove('escondido');
  $('botao-sair-vinculo').classList.add('escondido');
  if (statusCasal?.aguardando) {
    trocarPainelVinculo(false);
    $('esperando').classList.remove('escondido');
  }
  mostrar('tela-vinculo');
}


// ------------------------------------------------------------
// Entrada: login e cadastro
// ------------------------------------------------------------
function trocarModo(cadastro) {
  modoCadastro = cadastro;
  $('aba-entrar').classList.toggle('ativo', !cadastro);
  $('aba-criar').classList.toggle('ativo', cadastro);
  document.querySelectorAll('.so-cadastro').forEach(el => el.classList.toggle('escondido', !cadastro));
  $('botao-entrada').textContent   = cadastro ? 'Criar minha conta' : 'Entrar';
  $('entrada-subtitulo').textContent = cadastro ? 'Vamos começar' : 'Que bom ter você aqui';
  $('campo-senha').autocomplete    = cadastro ? 'new-password' : 'current-password';
  $('botao-esqueci').classList.toggle('escondido', cadastro);
  aviso('aviso-entrada', '');
}

async function enviarEntrada(e) {
  e.preventDefault();
  const email   = $('campo-email').value.trim();
  const senha   = $('campo-senha').value;
  const apelido = $('campo-apelido').value.trim();
  const botao   = $('botao-entrada');

  if (!email || !senha)        return aviso('aviso-entrada', 'Preencha e-mail e senha.');
  if (modoCadastro && senha.length < 8) return aviso('aviso-entrada', 'A senha precisa de 8 caracteres ou mais.');
  if (modoCadastro && !$('campo-idade').checked) return aviso('aviso-entrada', 'Confirme que você tem 18 anos ou mais.');

  botao.disabled = true;
  botao.textContent = 'Um instante…';
  aviso('aviso-entrada', '');

  try {
    if (modoCadastro) {
      const r = await Conta.criarConta(email, senha, apelido);
      if (r.session) {              // confirmação de e-mail desligada
        await seguirDepoisDoLogin();
      } else {
        $('email-enviado').textContent = email;
        mostrar('tela-confirmar');
      }
    } else {
      await Conta.entrar(email, senha);
      await seguirDepoisDoLogin();
    }
  } catch (erro) {
    aviso('aviso-entrada', erro.message);
  } finally {
    botao.disabled = false;
    botao.textContent = modoCadastro ? 'Criar minha conta' : 'Entrar';
  }
}

async function esqueciSenha() {
  const email = $('campo-email').value.trim();
  if (!email) return aviso('aviso-entrada', 'Escreva seu e-mail primeiro.');
  try {
    await Conta.recuperarSenha(email);
    aviso('aviso-entrada', 'Link enviado. Confira seu e-mail.', true);
  } catch (erro) {
    aviso('aviso-entrada', erro.message);
  }
}


// ------------------------------------------------------------
// Vínculo do casal
// ------------------------------------------------------------
function trocarPainelVinculo(usarCodigo) {
  $('aba-convidar').classList.toggle('ativo', !usarCodigo);
  $('aba-codigo').classList.toggle('ativo', usarCodigo);
  $('painel-convidar').classList.toggle('ativo', !usarCodigo);
  $('painel-codigo').classList.toggle('ativo', usarCodigo);
  aviso('aviso-vinculo', '');
}

async function gerarCodigo() {
  const botao = $('botao-gerar');
  botao.disabled = true;
  botao.textContent = 'Gerando…';
  aviso('aviso-vinculo', '');

  try {
    const r = await Conta.gerarConvite();
    $('codigo-valor').textContent = r.codigo;
    $('codigo-prazo').textContent = 'Vale por 24 horas';
    $('caixa-codigo').classList.remove('escondido');
    $('botao-copiar').classList.remove('escondido');
    $('esperando').classList.remove('escondido');
    botao.textContent = 'Gerar outro código';
    vigiarVinculo();
  } catch (erro) {
    aviso('aviso-vinculo', erro.message);
    botao.textContent = 'Gerar código';
  } finally {
    botao.disabled = false;
  }
}

async function copiarCodigo() {
  const codigo = $('codigo-valor').textContent;
  try {
    await navigator.clipboard.writeText(codigo);
    recado('Código copiado');
  } catch {
    recado(`Seu código: ${codigo}`);
  }
}

async function vincular() {
  const codigo = $('campo-codigo').value.trim();
  const botao  = $('botao-vincular');

  if (codigo.replace(/[^A-Za-z0-9]/g, '').length !== 8) {
    return aviso('aviso-vinculo', 'O código tem 8 caracteres.');
  }

  botao.disabled = true;
  botao.textContent = 'Vinculando…';
  aviso('aviso-vinculo', '');

  try {
    await Conta.usarConvite(codigo);
    recado('Vocês estão juntos 💛');
    pararVigia();
    statusCasal = await Conta.buscarStatus();
    $('campo-codigo').value = '';
    if (Pin.temPin()) await abrirApp();
    else await seguirDepoisDoLogin();
  } catch (erro) {
    aviso('aviso-vinculo', erro.message);
  } finally {
    botao.disabled = false;
    botao.textContent = 'Vincular';
  }
}

// Verifica de tempos em tempos se o parceiro já entrou
function vigiarVinculo() {
  pararVigia();
  relogioEspera = setInterval(async () => {
    try {
      const s = await Conta.buscarStatus();
      if (s.vinculado) {
        pararVigia();
        statusCasal = s;
        recado('Seu amor entrou 💛');
        if (Pin.temPin()) await abrirApp();
        else await seguirDepoisDoLogin();
      }
    } catch { /* sem internet: tenta de novo depois */ }
  }, 5000);
}

function pararVigia() {
  if (relogioEspera) { clearInterval(relogioEspera); relogioEspera = null; }
}


// ------------------------------------------------------------
// Teclado do PIN
// ------------------------------------------------------------
function montarTeclado(id, aoTocar) {
  const teclado = $(id);
  teclado.innerHTML = '';
  const teclas = ['1','2','3','4','5','6','7','8','9','','0','apagar'];

  teclas.forEach(t => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tecla' + (t === '' ? ' vazia' : '') + (t === 'apagar' ? ' apagar' : '');
    b.textContent = t === 'apagar' ? '⌫' : t;
    if (t !== '') b.addEventListener('click', () => aoTocar(t));
    teclado.appendChild(b);
  });
}

function atualizarPontos(id, quantos) {
  $(id).querySelectorAll('i').forEach((p, i) => p.classList.toggle('cheio', i < quantos));
}

function tremer(id) {
  const el = $(id);
  el.classList.add('errou');
  setTimeout(() => el.classList.remove('errou'), 450);
}


// ---------- Criar PIN ----------
async function aoDigitarCriar(tecla) {
  vibrar();
  if (tecla === 'apagar') pinDigitado = pinDigitado.slice(0, -1);
  else if (pinDigitado.length < TAMANHO_PIN) pinDigitado += tecla;

  atualizarPontos('pontos-criar', pinDigitado.length);
  if (pinDigitado.length < TAMANHO_PIN) return;

  await new Promise(r => setTimeout(r, 160));

  if (etapaPin === 'criar') {
    pinNovo = pinDigitado;
    pinDigitado = '';
    etapaPin = 'repetir';
    atualizarPontos('pontos-criar', 0);
    $('titulo-criar-pin').textContent = 'Repita o PIN';
    $('texto-criar-pin').textContent  = 'Só para confirmar';
    aviso('aviso-criar-pin', '');
    return;
  }

  if (pinDigitado !== pinNovo) {
    tremer('pontos-criar');
    vibrar([40, 60, 40]);
    pinDigitado = ''; pinNovo = ''; etapaPin = 'criar';
    atualizarPontos('pontos-criar', 0);
    $('titulo-criar-pin').textContent = 'Crie seu PIN';
    $('texto-criar-pin').textContent  = 'Quatro números para abrir o app.';
    return aviso('aviso-criar-pin', 'Os PINs não bateram. Tente de novo.');
  }

  await Pin.definirPin(pinNovo);
  pinNovo = ''; pinDigitado = '';
  recado(trocandoPin ? 'PIN trocado' : 'PIN criado');
  trocandoPin = false;
  await abrirApp();
}


// ---------- Desbloquear ----------
async function aoDigitarPin(tecla) {
  if (Pin.segundosBloqueado()) {
    return aviso('aviso-pin', `Espere ${Pin.segundosBloqueado()}s para tentar de novo.`);
  }

  vibrar();
  if (tecla === 'apagar') pinDigitado = pinDigitado.slice(0, -1);
  else if (pinDigitado.length < TAMANHO_PIN) pinDigitado += tecla;

  atualizarPontos('pontos-pin', pinDigitado.length);
  if (pinDigitado.length < TAMANHO_PIN) return;

  const certo = await Pin.conferirPin(pinDigitado);
  pinDigitado = '';

  if (certo) {
    atualizarPontos('pontos-pin', 0);
    aviso('aviso-pin', '');
    return abrirApp();
  }

  tremer('pontos-pin');
  vibrar([40, 60, 40]);
  atualizarPontos('pontos-pin', 0);

  const preso = Pin.segundosBloqueado();
  const resta = Pin.tentativasRestantes();
  aviso('aviso-pin', preso
    ? `Muitas tentativas. Espere ${preso}s.`
    : `PIN errado. ${resta} ${resta === 1 ? 'tentativa restante' : 'tentativas restantes'}.`);
}


// ------------------------------------------------------------
// Abas
// ------------------------------------------------------------
function trocarAba(nome) {
  document.querySelectorAll('.aba').forEach(b => b.classList.toggle('ativa', b.dataset.aba === nome));
  document.querySelectorAll('.aba-conteudo').forEach(c => c.classList.toggle('ativa', c.id === 'aba-' + nome));
}


// ------------------------------------------------------------
// Ajustes
// ------------------------------------------------------------
async function sairDaConta() {
  pararVigia();
  Pin.apagarPin();
  localStorage.removeItem('entrenos.tour');
  await Conta.sair();
  statusCasal = null;
  trocarModo(false);
  $('campo-senha').value = '';
  mostrar('tela-entrada');
}

async function desvincular() {
  if (!confirm('Isso apaga tudo o que vocês compartilharam e não dá para voltar atrás. Continuar?')) return;
  try {
    await Conta.desfazerVinculo();
    recado('Vínculo desfeito');
    statusCasal = await Conta.buscarStatus();
    await abrirApp();
  } catch (erro) {
    recado(erro.message);
  }
}

function trocarPin() {
  trocandoPin = true;
  etapaPin = 'criar'; pinNovo = ''; pinDigitado = '';
  atualizarPontos('pontos-criar', 0);
  $('titulo-criar-pin').textContent = 'Novo PIN';
  $('texto-criar-pin').textContent  = 'Quatro números para abrir o app.';
  aviso('aviso-criar-pin', '');
  mostrar('tela-criar-pin');
}


// ------------------------------------------------------------
// Eventos
// ------------------------------------------------------------
function ligarEventos() {
  // Entrada
  $('aba-entrar').addEventListener('click', () => trocarModo(false));
  $('aba-criar').addEventListener('click',  () => trocarModo(true));
  $('form-entrada').addEventListener('submit', enviarEntrada);
  $('botao-esqueci').addEventListener('click', esqueciSenha);
  $('ver-senha').addEventListener('click', () => {
    const c = $('campo-senha');
    c.type = c.type === 'password' ? 'text' : 'password';
  });
  $('botao-voltar-entrada').addEventListener('click', () => { trocarModo(false); mostrar('tela-entrada'); });

  // Vínculo
  $('aba-convidar').addEventListener('click', () => trocarPainelVinculo(false));
  $('aba-codigo').addEventListener('click',   () => trocarPainelVinculo(true));
  $('botao-gerar').addEventListener('click',  gerarCodigo);
  $('botao-copiar').addEventListener('click', copiarCodigo);
  $('botao-vincular').addEventListener('click', vincular);
  $('botao-sair-vinculo').addEventListener('click', sairDaConta);

  // Deixa o código bonitinho enquanto digita
  $('campo-codigo').addEventListener('input', (e) => {
    let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    e.target.value = v.length > 4 ? v.slice(0, 4) + '-' + v.slice(4) : v;
  });

  // Principal
  document.querySelectorAll('.aba').forEach(b =>
    b.addEventListener('click', () => trocarAba(b.dataset.aba)));

  $('botao-desejo').addEventListener('click', () => {
    vibrar([18, 40, 18]);
    recado(statusCasal?.vinculado
      ? 'Os sinais chegam na próxima etapa 🔥'
      : 'Convide seu amor para enviar de verdade 💌');
  });

  // Tour
  $('botao-tour').addEventListener('click', avancarTour);
  $('botao-pular-tour').addEventListener('click', terminarTour);

  // Convite pelo modo sozinho
  $('faixa-convite').addEventListener('click', abrirConvite);
  $('botao-convidar-ajustes').addEventListener('click', abrirConvite);
  $('botao-voltar-vinculo').addEventListener('click', () => mostrar('tela-principal'));

  // Ajustes
  $('botao-ajustes').addEventListener('click', () => mostrar('tela-ajustes'));
  $('botao-fechar-ajustes').addEventListener('click', () => mostrar('tela-principal'));
  $('botao-trocar-pin').addEventListener('click', trocarPin);
  $('botao-sair').addEventListener('click', sairDaConta);
  $('botao-desvincular').addEventListener('click', desvincular);

  $('botao-esqueci-pin').addEventListener('click', () => {
    if (!confirm('Para criar um PIN novo, você precisa entrar de novo com e-mail e senha. Continuar?')) return;
    sairDaConta();
  });

  // Tranca o app ao sair dele
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && $('tela-principal').classList.contains('ativa')) {
      if (Pin.temPin()) pedirPin();
    }
  });
}


// ------------------------------------------------------------
// Service worker (preparo para as notificações da Etapa 2)
// ------------------------------------------------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

iniciar();
