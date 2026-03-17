const easyQuestions = [
  {
    q: "O bem jurídico protegido nos crimes licitatórios é principalmente:",
    options: ["Patrimônio privado", "Liberdade individual", "Moralidade administrativa", "Honra"],
    answer: 2,
  },
  {
    q: "Empresas que combinam preços para que uma delas vença a licitação cometem:",
    options: ["Patrocínio de contratação indevida", "Corrupção passiva", "Fraude ao caráter competitivo", "Peculato"],
    answer: 2,
  },
  {
    q: "O crime de impedimento indevido (art. 337-N):",
    options: ["Só pode ser praticado por servidor público", "É crime comum", "Só pode ser praticado por licitante", "Exige vantagem econômica"],
    answer: 1,
  },
];

const hardQuestions = [
  {
    q: "O crime de patrocínio de contratação indevida exige:",
    options: ["Investimento financeiro", "Acordo entre empresas", "Atuação perante a Administração defendendo interesse privado", "Uso de documento falso"],
    answer: 2,
  },
  {
    q: "A fraude em licitação (art. 337-L):",
    options: ["É crime material", "Exige prejuízo efetivo", "É crime formal", "Exige enriquecimento ilícito"],
    answer: 2,
  },
  {
    q: "Servidor permite que empresa declarada inidônea participe da licitação, mas ela não vence. A tipificação correta é:",
    options: ["Crime consumado", "Crime tentado", "Fato atípico", "Crime impossível"],
    answer: 1,
  },
    {
    q: "O projetista erra um cálculo técnico por negligência, causando prejuízo à Administração. Nesse caso:",
    options: ["Configura crime do art. 337-O", "Configura crime culposo", "Fato atípico penalmente", "Configura fraude"],
    answer: 2,
  },
];

const questions = [...easyQuestions, ...hardQuestions];

const prizeLadder = [1000, 5000, 10000, 50000, 100000, 500000, 1000000];

const gameState = {
  round: 0,
  currentPrize: 0,
  used5050: false,
  usedSkip: false,
  usedAudience: false,
  soundEnabled: true,
  locked: false,
};

const soundBank = {
  intro: "assets/audios/vai-comecar.wav",
  suspense: "assets/audios/suspense.wav",
  question: "assets/audios/perguntashowdomilhao.mp3",
  answerReveal: "assets/audios/quel-e-a-resposta-certa.wav",
  entrou: "assets/audios/entrou-bem.wav",
  caminhoCorreto: "assets/audios/caminho-certo.wav",
  correct: "assets/audios/certa-resposta-boa.wav",
  correctAlt: "assets/audios/esta-certo-disso.wav",
  parabens: "assets/audios/parabens.wav",
  wrong: "assets/audios/que-pena.wav",
  skip: "assets/audios/vai-pular-ok.wav",
  audience: "assets/audios/o-que-vao-dizer-as-cartas.wav",
  fifty: "assets/audios/ajuda1.wav",
  stop: "assets/audios/ok-parou.wav",
  million: "assets/audios/ganhou-1-milhao.wav",
};

let suspenseAudio = null;
let backgroundMusicEnabled = true; // Habilitada por padrão na tela inicial

const ui = {
  introPanel: document.getElementById("introPanel"),
  gamePanel: document.getElementById("gamePanel"),
  resultPanel: document.getElementById("resultPanel"),
  questionText: document.getElementById("questionText"),
  answers: document.getElementById("answers"),
  roundLabel: document.getElementById("roundLabel"),
  currentPrize: document.getElementById("currentPrize"),
  help5050: document.getElementById("help5050"),
  helpSkip: document.getElementById("helpSkip"),
  helpAudience: document.getElementById("helpAudience"),
  soundToggle: document.getElementById("soundToggle"),
  resultTitle: document.getElementById("resultTitle"),
  resultText: document.getElementById("resultText"),
  introTitle: document.getElementById("introTitle"),
  prizeIfWrong: document.getElementById("prizeIfWrong"),
  prizeIfStop: document.getElementById("prizeIfStop"),
  prizeIfCorrect: document.getElementById("prizeIfCorrect"),
};

document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("restartBtn").addEventListener("click", startGame);
document.getElementById("stopBtn").addEventListener("click", stopAndTakePrize);
ui.help5050.addEventListener("click", use5050);
ui.helpSkip.addEventListener("click", useSkip);
ui.helpAudience.addEventListener("click", useAudience);
ui.soundToggle.addEventListener("click", toggleSound);

// Inicializar música de fundo no DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded - iniciando música de fundo");
  syncStaticTexts();
  setTimeout(() => {
    playBackgroundMusic();
  }, 300);
});

// Splash Screen
window.addEventListener("load", () => {
  const splash = document.getElementById("splashScreen");
  if (splash) {
    setTimeout(() => {
      splash.style.display = "none";
    }, 2000);
  }
  
  // Iniciar música de fundo quando página carrega (com pequeno delay)
  setTimeout(() => {
    playBackgroundMusic();
  }, 100);
});

function startGame() {
  gameState.round = 0;
  gameState.currentPrize = 0;
  gameState.used5050 = false;
  gameState.usedSkip = false;
  gameState.usedAudience = false;
  gameState.locked = false;
  backgroundMusicEnabled = false;

  ui.introPanel.classList.add("hidden");
  ui.resultPanel.classList.add("hidden");
  ui.gamePanel.classList.remove("hidden");
  updateHelpButtons();
  
  // Parar música de fundo quando jogo inicia
  pauseBackgroundMusic();
  
  loadRound();
  playTheme();
  playClip("intro", [220, 330, 440]);
}

function loadRound() {
  gameState.locked = false;
  const question = questions[gameState.round];
  ui.questionText.textContent = question.q;
  ui.answers.innerHTML = "";

  question.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.className = "answer";
    btn.setAttribute("data-number", index + 1);
    btn.textContent = option;
    btn.addEventListener("click", () => answerQuestion(index));
    ui.answers.appendChild(btn);
  });

  ui.roundLabel.textContent = `${gameState.round + 1} / ${questions.length}`;
  ui.currentPrize.textContent = formatPrize(gameState.currentPrize);
  updatePrizePreview();
  updateHelpButtons();
  
  // Sequência de áudios para abertura da pergunta (similar ao jogo original)
  const isMilestone = isMilestoneRound(gameState.round);
  
  if (isMilestone) {
    // A cada 3 perguntas: toca áudio especial de revelação
    playClip("answerReveal", [280, 330, 280]);
  } else if (gameState.round === 0) {
    // Primeira pergunta: toca "entrou bem"
    playClip("entrou", [220, 280, 220]);
  } else {
    // Perguntas normais: toca pergunta padrão
    playClip("question", [280, 330, 280]);
  }
  
  // Iniciar suspense após 1.5s da pergunta terminar (simula espera da pergunta ser processada)
  setTimeout(() => {
    playSuspense();
  }, 1500);
}

function answerQuestion(index) {
  if (gameState.locked) return;
  gameState.locked = true;

  const question = questions[gameState.round];
  const answerButtons = Array.from(ui.answers.children);
  const isCorrect = index === question.answer;
  stopSuspense();

  answerButtons.forEach((btn, i) => {
    if (i === question.answer) btn.classList.add("correct");
    if (i === index && !isCorrect) btn.classList.add("wrong");
    btn.disabled = true;
  });

  if (isCorrect) {
    gameState.currentPrize = prizeLadder[gameState.round];
    
    // Determinar qual áudio de acerto tocar
    let correctSound = "correct";
    const isMilestone = isMilestoneRound(gameState.round);
    if (isMilestone) {
      correctSound = "correctAlt";
    }
    
    // Toca som de acerto
    playClip(correctSound, [420, 520, 660]);

    setTimeout(() => {
      if (gameState.round === questions.length - 1) {
        // Última pergunta: toca som de vitória
        playClip("million", [660, 700, 820]);
        endGame(true, `VOCE FEZ 1 MILHAO! Premio final: ${formatPrize(gameState.currentPrize)}.`);
        return;
      }
      
      // Toca "Parabéns" com pausinha antes da próxima pergunta
      playClip("parabens", [420, 520, 660]);
      
      setTimeout(() => {
        gameState.round += 1;
        loadRound();
      }, 1500);
    }, 1200);
  } else {
    playClip("wrong", [340, 220, 120]);
    const wrongPrize = getWrongPrize();
    setTimeout(() => {
      endGame(false, `Resposta incorreta. Voce saiu com ${formatPrize(wrongPrize)}.`);
    }, 1400);
  }
}

function stopAndTakePrize() {
  stopSuspense();
  if (gameState.round === 0 && gameState.currentPrize === 0) {
    endGame(false, "Voce parou antes da primeira pergunta valer premio.");
    return;
  }
  playClip("stop", [660, 540, 620]);
  endGame(true, `Boa estrategia! Voce levou ${formatPrize(gameState.currentPrize)}.`);
}

function use5050() {
  if (gameState.used5050 || gameState.locked || isFinalRound()) return;
  gameState.used5050 = true;
  updateHelpButtons();

  const question = questions[gameState.round];
  const wrongIndexes = [0, 1, 2, 3].filter((i) => i !== question.answer);
  shuffleArray(wrongIndexes);
  const toDisable = wrongIndexes.slice(0, 2);

  Array.from(ui.answers.children).forEach((btn, i) => {
    if (toDisable.includes(i)) {
      btn.disabled = true;
      btn.classList.add("disabled");
    }
  });

  playClip("fifty", [500, 400]);
}

function useSkip() {
  if (gameState.usedSkip || gameState.locked || isFinalRound()) return;
  gameState.usedSkip = true;
  updateHelpButtons();

  playClip("skip", [300, 350, 430]);
  gameState.round += 1;
  loadRound();
}

function useAudience() {
  if (gameState.usedAudience || gameState.locked || isFinalRound()) return;
  gameState.usedAudience = true;
  updateHelpButtons();

  const correct = questions[gameState.round].answer;
  const percentages = generateAudienceHint(correct);
  const hint = percentages
    .map((p, i) => `${String.fromCharCode(65 + i)}: ${p}%`)
    .join(" | ");

  playClip("audience", [280, 320, 420, 460]);
  alert(`Plateia opina:\n${hint}`);
}

function generateAudienceHint(correctIndex) {
  const base = [0, 0, 0, 0];
  const correctPct = Math.floor(Math.random() * 21) + 45;
  let remaining = 100 - correctPct;

  base[correctIndex] = correctPct;
  const wrongIndexes = [0, 1, 2, 3].filter((i) => i !== correctIndex);

  wrongIndexes.forEach((idx, i) => {
    if (i === wrongIndexes.length - 1) {
      base[idx] = remaining;
    } else {
      const share = Math.floor(Math.random() * (remaining + 1));
      base[idx] = share;
      remaining -= share;
    }
  });

  return base;
}

function updateHelpButtons() {
  const disableForFinal = isFinalRound() && !gameState.locked;

  ui.help5050.classList.toggle("used", gameState.used5050);
  ui.helpSkip.classList.toggle("used", gameState.usedSkip);
  ui.helpAudience.classList.toggle("used", gameState.usedAudience);

  ui.help5050.disabled = gameState.used5050 || disableForFinal;
  ui.helpSkip.disabled = gameState.usedSkip || disableForFinal;
  ui.helpAudience.disabled = gameState.usedAudience || disableForFinal;
}

function endGame(win, message) {
  stopSuspense();
  ui.gamePanel.classList.add("hidden");
  ui.resultPanel.classList.remove("hidden");
  ui.resultTitle.textContent = win ? "Que jogo!" : "Fim de jogo";
  ui.resultText.textContent = message;
  
  // Retomar música de fundo após 3 segundos
  backgroundMusicEnabled = true;
  setTimeout(() => {
    if (backgroundMusicEnabled) {
      playBackgroundMusic();
    }
  }, 3000);
}

function syncStaticTexts() {
  if (ui.introTitle) {
    ui.introTitle.textContent = `Você topa encarar ${questions.length} perguntas?`;
  }

  if (ui.roundLabel) {
    ui.roundLabel.textContent = `1 / ${questions.length}`;
  }

  updatePrizePreview();
}

function updatePrizePreview() {
  if (!ui.prizeIfWrong || !ui.prizeIfStop || !ui.prizeIfCorrect) return;

  const ifWrong = getWrongPrizePreview();
  const ifStop = gameState.currentPrize;
  const ifCorrect = prizeLadder[gameState.round] ?? gameState.currentPrize;

  ui.prizeIfWrong.textContent = formatPrize(ifWrong);
  ui.prizeIfStop.textContent = formatPrize(ifStop);
  ui.prizeIfCorrect.textContent = formatPrize(ifCorrect);
}

function toggleSound() {
  gameState.soundEnabled = !gameState.soundEnabled;
  ui.soundToggle.textContent = `Som: ${gameState.soundEnabled ? "ON" : "OFF"}`;

  if (!gameState.soundEnabled) {
    stopSuspense();
  } else if (!ui.gamePanel.classList.contains("hidden")) {
    playSuspense();
  }
}

function playSuspense() {
  if (!gameState.soundEnabled) return;
  stopSuspense();

  suspenseAudio = new Audio(soundBank.suspense);
  suspenseAudio.loop = true;
  suspenseAudio.volume = 0.4;
  suspenseAudio.playbackRate = 1;
  
  const playPromise = suspenseAudio.play();
  if (playPromise !== undefined) {
    playPromise.catch((error) => {
      console.log("Suspense não tocou:", error);
      playTone([180, 190, 180], 0.12);
    });
  }
}

function stopSuspense() {
  if (!suspenseAudio) return;
  suspenseAudio.pause();
  suspenseAudio.currentTime = 0;
  suspenseAudio = null;
}

function playTheme() {
  if (!gameState.soundEnabled) return;
  const themeAudio = document.getElementById("themeAudio");
  if (!themeAudio) return;
  
  themeAudio.volume = 0.7;
  themeAudio.currentTime = 0;
  
  const playPromise = themeAudio.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => console.log("Trilha tema tocando"))
      .catch((error) => {
        console.log("Autoplay bloqueado:", error);
      });
  }
}

function playBackgroundMusic() {
  console.log("playBackgroundMusic chamada - soundEnabled:", gameState.soundEnabled, "backgroundMusicEnabled:", backgroundMusicEnabled);
  if (!gameState.soundEnabled || !backgroundMusicEnabled) {
    console.log("Abortando música de fundo: som desabilitado ou flag desabilitada");
    return;
  }
  
  const audio = document.getElementById("backgroundMusic");
  if (!audio) {
    console.log("Elemento backgroundMusic não encontrado");
    return;
  }
  
  audio.volume = 0.5;
  audio.currentTime = 0;
  
  console.log("Tentando tocar música de fundo...");
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => console.log("Música de fundo tocando"))
      .catch((error) => {
        console.log("Música de fundo não pode tocar:", error);
      });
  }
}

function pauseBackgroundMusic() {
  backgroundMusicEnabled = false;
  const audio = document.getElementById("backgroundMusic");
  if (!audio) return;
  
  audio.pause();
  audio.currentTime = 0;
}

function playClip(name, fallbackFrequencies) {
  if (!gameState.soundEnabled) return;
  const path = soundBank[name];
  if (!path) {
    playTone(fallbackFrequencies, 0.08);
    return;
  }

  const audio = new Audio(path);
  audio.volume = 0.8;
  audio.playbackRate = 1;
  
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch((error) => {
      console.log("Falha ao tocar áudio:", error);
      playTone(fallbackFrequencies, 0.08);
    });
  }
}

function isFinalRound() {
  return gameState.round === questions.length - 1;
}

function getWrongPrize() {
  return getWrongPrizePreview();
}

function getWrongPrizePreview() {
  if (isFinalRound()) return 0;
  if (gameState.currentPrize <= 0) return 0;
  return Math.floor(gameState.currentPrize / 2);
}

function isMilestoneRound(roundIndex) {
  return (roundIndex + 1) % 3 === 0;
}

function playTone(frequencies, noteTime = 0.07) {
  if (!gameState.soundEnabled) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  let t = ctx.currentTime;

  frequencies.forEach((f) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(f, t);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + noteTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + noteTime);
    t += noteTime * 0.92;
  });

  setTimeout(() => ctx.close(), 600);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function formatPrize(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}
