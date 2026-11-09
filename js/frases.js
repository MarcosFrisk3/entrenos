// ============================================================
// EntreNós — Biblioteca de frases
//
// Para acrescentar frases, é só escrever mais linhas nas listas.
// Para traduzir o app, basta copiar este arquivo para outro idioma.
// ============================================================

export const TONS = [
  { id: 'romantico', nome: 'Romântico', emoji: '💕', cor: '#C98BA6' },
  { id: 'saudade',   nome: 'Saudade',   emoji: '🌙', cor: '#9BA6D4' },
  { id: 'picante',   nome: 'Picante',   emoji: '🔥', cor: '#D98A6B' }
];

export const DESEJOS = {
  romantico: [
    { id: 'pensando',  nome: 'Pensando em você', emoji: '💭' },
    { id: 'abraco',    nome: 'Um abraço',        emoji: '🤍' },
    { id: 'elogio',    nome: 'Um elogio',        emoji: '✨' },
    { id: 'encontro',  nome: 'Um encontro',      emoji: '🥂' },
    { id: 'livre',     nome: 'Escrever o meu',   emoji: '✍️' }
  ],
  saudade: [
    { id: 'falta',     nome: 'Que falta',        emoji: '🌙' },
    { id: 'colo',      nome: 'Queria seu colo',  emoji: '🫂' },
    { id: 'volta',     nome: 'Volta logo',       emoji: '🕰' },
    { id: 'sonhei',    nome: 'Sonhei com você',  emoji: '💤' },
    { id: 'livre',     nome: 'Escrever o meu',   emoji: '✍️' }
  ],
  picante: [
    { id: 'beijos',    nome: 'Beijos pelo corpo', emoji: '💋' },
    { id: 'banho',     nome: 'Banho a dois',      emoji: '🚿' },
    { id: 'massagem',  nome: 'Massagem',          emoji: '💆' },
    { id: 'intimo',    nome: 'Carinho íntimo',    emoji: '😈' },
    { id: 'hoje',      nome: 'Hoje à noite',      emoji: '🌃' },
    { id: 'livre',     nome: 'Escrever o meu',    emoji: '✍️' }
  ]
};

export const FRASES = {
  // ---------- ROMÂNTICO ----------
  'romantico:pensando': [
    'Parei tudo o que estava fazendo só para pensar em você.',
    'Você apareceu na minha cabeça e o meu dia melhorou na hora.',
    'Não sei o que você está fazendo agora, mas eu estou pensando em você.',
    'Tem gente ocupando os meus pensamentos. E essa gente é você.'
  ],
  'romantico:abraco': [
    'Queria te abraçar agora e ficar um tempo sem dizer nada.',
    'Guardei um abraço pra você. Dos demorados.',
    'Hoje eu só queria o seu abraço, mais nada.',
    'Se eu pudesse escolher um lugar pra estar, seria nos seus braços.'
  ],
  'romantico:elogio': [
    'Você é bonita até quando nem está tentando.',
    'Tem um jeito seu de olhar que me desmonta.',
    'Eu me sinto sortudo toda vez que lembro que é você.',
    'Você faz as coisas simples ficarem especiais.'
  ],
  'romantico:encontro': [
    'Que tal só nós dois hoje, sem pressa nenhuma?',
    'Reserva um tempo pra mim hoje à noite. Deixa o resto pra depois.',
    'Queria um jantar demorado com você, daqueles que viram madrugada.',
    'Vamos fazer o mundo lá fora esperar um pouco?'
  ],

  // ---------- SAUDADE ----------
  'saudade:falta': [
    'Hoje a sua falta chegou sem avisar.',
    'Sinto falta do básico: você aqui, do meu lado.',
    'A casa fica diferente quando você não está.',
    'Estou com saudade daquele seu jeito de me chamar.'
  ],
  'saudade:colo': [
    'Queria seu colo e nada mais.',
    'Hoje eu só precisava deitar em você.',
    'Se você estivesse aqui, eu nem falaria. Só ficaria perto.',
    'Meu lugar preferido no mundo tem seu cheiro.'
  ],
  'saudade:volta': [
    'Volta logo. Estou contando as horas.',
    'O dia passa mais devagar quando você está longe.',
    'Já estou esperando a hora de te ver.',
    'Cada minuto sem você demora o dobro.'
  ],
  'saudade:sonhei': [
    'Sonhei com você e acordei querendo mais.',
    'Você apareceu no meu sonho e estragou o meu dia inteiro, de tanta saudade.',
    'Dormi pensando em você e acordei igual.',
    'Tive um sonho bom. Adivinha quem estava nele.'
  ],

  // ---------- PICANTE ----------
  'picante:beijos': [
    'Estou com vontade de começar pela sua boca e ir descendo devagar.',
    'Queria beijar você inteira, sem pressa nenhuma.',
    'Tenho uns beijos guardados e eles não são nada comportados.',
    'Hoje eu começaria pelo seu pescoço e demoraria bastante por ali.'
  ],
  'picante:banho': [
    'Que tal um banho demorado hoje, só nós dois?',
    'Estou pensando em você, em mim e em muita água quente.',
    'Fica um tempo a mais no banho hoje. Eu te encontro lá.',
    'Imaginei você no banho. E eu junto.'
  ],
  'picante:massagem': [
    'Deita de bruços hoje que eu cuido do resto.',
    'Quero passar a mão nas suas costas até você esquecer o dia inteiro.',
    'Reservei um tempo pra relaxar você. Bem devagar.',
    'Hoje é dia de óleo, luz baixa e as minhas mãos.'
  ],
  'picante:intimo': [
    'Estou com vontade de te deixar sem jeito do jeito que você gosta.',
    'Tenho um plano pra hoje e ele envolve você perdendo a linha.',
    'Queria ouvir você perdendo o fôlego por minha causa.',
    'Hoje eu quero cuidar de você com calma. Muita calma.'
  ],
  'picante:hoje': [
    'Hoje à noite você é minha. Combinado?',
    'Guarda energia pra mais tarde. Você vai precisar.',
    'Hoje a gente dorme tarde.',
    'Quando as luzes apagarem, o mundo pode esperar.'
  ]
};

// Respostas rápidas de quem recebe
export const RESPOSTAS = [
  { id: 'tambem',   texto: 'Também quero…',          emoji: '🔥' },
  { id: 'mais',     texto: 'Me provoca mais',        emoji: '😏' },
  { id: 'noite',    texto: 'Hoje à noite',           emoji: '🌃' },
  { id: 'minutos',  texto: 'Contando os minutos',    emoji: '⏳' },
  { id: 'amei',     texto: 'Amei isso',              emoji: '💛' },
  { id: 'hojenao',  texto: 'Hoje não, meu amor',     emoji: '🙈' }
];


// Sorteia frases sem repetir a última usada
const ultimas = {};

export function sugerir(tom, desejo, quantas = 3) {
  const lista = FRASES[`${tom}:${desejo}`] || [];
  if (lista.length === 0) return [];

  const chave = `${tom}:${desejo}`;
  const evitar = ultimas[chave];

  const sobra = lista.filter(f => f !== evitar);
  const baralho = sobra.length >= quantas ? sobra : lista.slice();

  // Embaralha
  for (let i = baralho.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [baralho[i], baralho[j]] = [baralho[j], baralho[i]];
  }

  const escolhidas = baralho.slice(0, quantas);
  ultimas[chave] = escolhidas[0];
  return escolhidas;
}

export function nomeDoTom(tom) {
  return TONS.find(t => t.id === tom) || TONS[0];
}

export function nomeDoDesejo(tom, desejo) {
  return (DESEJOS[tom] || []).find(d => d.id === desejo);
}
