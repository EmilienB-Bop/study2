// ─── INITIALISATION FIREBASE (DATABASE AUDIO-8FF24) ─────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCrwPKIYzh6UYcsVOcsGo1AKy8q4MD2rMY",
  authDomain: "audio-8ff24.firebaseapp.com",
  databaseURL: "https://audio-8ff24-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "audio-8ff24",
  storageBucket: "audio-8ff24.firebasestorage.app",
  messagingSenderId: "909133718533",
  appId: "1:909133718533:web:bfade7746046102aece86c"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = (typeof firebase !== 'undefined') ? firebase.database() : null;

const subject_id = "sub_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

// ─── DÉTECTION MOBILE ROBUSTE ──────────────────────────────────────────────
function isComputer() {
  const ua = navigator.userAgent.toLowerCase();
  const isMobileUA = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(ua);
  const minDim = Math.min(window.screen.width, window.screen.height);
  const maxDim = Math.max(window.screen.width, window.screen.height);
  const isMobileDimensions = (minDim < 600 || maxDim < 950);
  const isIPad = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 && minDim < 850);

  if (isMobileUA || isMobileDimensions || isIPad) {
    return false;
  }
  return true;
}

// ─── CODE PRINCIPAL APRÈS CHARGEMENT DE LA PAGE ─────────────────────────────
window.addEventListener('DOMContentLoaded', () => {

  if (!isComputer()) {
    document.body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px;box-sizing:border-box;text-align:center;font-family:system-ui,-apple-system,sans-serif;color:#0f172a;background-color:#ffffff;">
        <div style="max-width:480px;background:#f8fafc;border:1px solid #cbd5e1;padding:30px 20px;border-radius:16px;box-shadow:0 10px 25px rgba(0,0,0,0.06);">
          <div style="font-size:3rem;margin-bottom:12px;">💻</div>
          <h2 style="margin:0 0 12px 0;font-size:1.4rem;color:#0f172a;">Appareil non compatible</h2>
          <p style="margin:0 0 20px 0;font-size:0.95rem;line-height:1.5;color:#334155;">
            Pour la validité scientifique des mesures, cette étude nécessite impérativement un <strong>ordinateur</strong> équipé d'un clavier et d'une souris physique.
          </p>
          <p style="margin:0 0 24px 0;font-size:0.85rem;color:#64748b;">
            Merci de renouveler l'expérience depuis un ordinateur portable ou de bureau.
          </p>
          <button onclick="window.location.href='https://www.univ-tlse2.fr/'" style="padding:12px 24px;font-size:0.95rem;font-weight:600;color:#ffffff;background:#2563eb;border:none;border-radius:8px;cursor:pointer;">
            Quitter l'expérience
          </button>
        </div>
      </div>
    `;
    return;
  }

  // Initialisation jsPsych
  const jsPsych = initJsPsych({
    use_webaudio: false,
    on_interaction_data_update: function (data) {
      if (data.event === "blur" || data.event === "fullscreenexit") {
        console.warn("Attention : focus perdu ou plein écran quitté à t=" + data.time);
      }
    }
  });

  const timeline = [];

  // Conditions expérimentales
  const speedcondition = Math.random() < 0.5 ? "slow" : "fast";
  const unexpectedSpeed = speedcondition === "slow" ? -80 : -200;

  const allVariants = [
    { id: 'none',                   hasUnexpected: false, shape: 'circle',   color: 'black', size: 'fixed'   },
    { id: 'circle_black_fixed',     hasUnexpected: true,  shape: 'circle',   color: 'black', size: 'fixed'   },
    { id: 'circle_black_pulsing',   hasUnexpected: true,  shape: 'circle',   color: 'black', size: 'pulsing' },
    { id: 'circle_red_fixed',       hasUnexpected: true,  shape: 'circle',   color: 'red',   size: 'fixed'   },
    { id: 'circle_red_pulsing',     hasUnexpected: true,  shape: 'circle',   color: 'red',   size: 'pulsing' },
    { id: 'triangle_black_fixed',   hasUnexpected: true,  shape: 'triangle', color: 'black', size: 'fixed'   },
    { id: 'triangle_black_pulsing', hasUnexpected: true,  shape: 'triangle', color: 'black', size: 'pulsing' },
    { id: 'triangle_red_fixed',     hasUnexpected: true,  shape: 'triangle', color: 'red',   size: 'fixed'   },
    { id: 'triangle_red_pulsing',   hasUnexpected: true,  shape: 'triangle', color: 'red',   size: 'pulsing' },
  ];

  const selectedVariantObj = jsPsych.randomization.sampleWithoutReplacement(allVariants, 1)[0];
  const selectedVariant    = selectedVariantObj.id;
  const hasUnexpected      = selectedVariantObj.hasUnexpected;
  const unexpectedShape    = selectedVariantObj.shape;
  const unexpectedColor    = selectedVariantObj.color;
  const unexpectedSizeMode = selectedVariantObj.size;

  const BASE_RADIUS      = 20;
  const PULSE_AMPLITUDE  = 0.10;
  const PULSE_FREQ       = 2;

  jsPsych.data.addProperties({
    subject_id:          subject_id,
    variant:             selectedVariant,
    us_shape:            unexpectedShape,
    us_color:            unexpectedColor,
    us_size_mode:        unexpectedSizeMode,
    has_unexpected:      hasUnexpected,
    speedcondition:      speedcondition,
    unexpected_speed_px: unexpectedSpeed,
    screen_width:        window.screen.width,
    screen_height:       window.screen.height,
    pixel_ratio:         window.devicePixelRatio || 1
  });

  // Moteur audio
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  document.addEventListener('click', () => { getAudioCtx(); });

  function playPitch(isHigh) {
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = isHigh ? 660 : 330;
      const gainValue = isHigh ? 0.2 : 0.6;
      gain.gain.setValueAtTime(gainValue, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  }

  function handleRebound(shape, onRebound) {
    const currentPitch = shape.pitch;
    playPitch(currentPitch === 'high');
    if (onRebound) onRebound(shape, currentPitch);
    shape.pitch = Math.random() < 0.5 ? 'high' : 'low';
  }

  // Consentement libre et éclairé
  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div style="max-width:780px;margin:20px auto;text-align:left;line-height:1.55;font-size:0.88rem;background:#f8fafc;padding:24px;border-radius:12px;border:1px solid #cbd5e1;max-height:70vh;overflow-y:auto;color:#1e293b;">
        <h2 style="text-align:center;font-size:1.25rem;margin-top:0;color:#0f172a;">Formulaire d'information et de consentement libre et éclairé</h2>
        <p>Avant d’accepter de participer à ce projet de recherche, veuillez prendre le temps de lire et de comprendre les renseignements qui suivent. Ce document vous explique le but de ce projet, ses procédures, avantages, risques et inconvénients. Vous pouvez interrompre votre participation à tout moment sans avoir à vous justifier.</p>
        <p style="background:rgba(46,204,113,0.15);padding:8px 12px;border-radius:6px;border-left:4px solid #2ecc71;">
          <strong>Avis éthique :</strong> Cette étude a reçu un avis favorable du Comité d’Éthique de la Recherche de Toulouse (avis n° 2026_1242, en date du 18/02/2026).
        </p>
        <p><strong>Responsable scientifique :</strong> Pr Céline Lemercier, Laboratoire CLLE & CNRS, Université Jean Jaurès, 5 allée Antonio Machado 31058 Toulouse cedex 9 (<a href="mailto:celine.lemercier@univ-tlse2.fr" style="color:#2563eb;">celine.lemercier@univ-tlse2.fr</a>)<br>
        <strong>Lieu :</strong> Université Toulouse Jean Jaurès, laboratoire CLLE.</p>
        <p><strong>Méthodologie :</strong> Vous effectuerez un court test auditif puis compterez les rebonds de formes à l'écran émettant un signal sonore spécifique lors de 5 essais de 30 secondes. Durée totale : environ 15 minutes.</p>
        <p><strong>Confidentialité :</strong> Cette étude est strictement anonyme. Aucune donnée nominative n'est collectée.</p>
        <p><strong>Contacts :</strong> DPO (<a href="mailto:dr14-rgpd@cnrs.fr" style="color:#2563eb;">dr14-rgpd@cnrs.fr</a>) | CER (<a href="mailto:bureau-cer@univ-toulouse.fr" style="color:#2563eb;">bureau-cer@univ-toulouse.fr</a>)</p>
      </div>
    `,
    choices: ["Je refuse de participer", "J'ai lu, compris et j'accepte de participer"],
    button_html: [
      '<button class="jspsych-btn" style="background:#64748b;color:#fff;margin:8px;">%choice%</button>',
      '<button class="jspsych-btn" style="background:#2563eb;color:#fff;font-weight:bold;margin:8px;">%choice%</button>'
    ],
    on_finish: function (data) {
      if (data.response === 0) {
        jsPsych.abort(`<div style="text-align:center;padding:50px;color:#0f172a;font-family:sans-serif;">
          <h3>Participation annulée</h3>
          <p>Vous avez choisi de ne pas participer. Aucune donnée n'a été enregistrée.</p>
          <p>Redirection en cours...</p>
        </div>`);
        setTimeout(() => { window.location.href = "https://www.univ-tlse2.fr/"; }, 2000);
      }
    }
  });

  // Plein écran
  timeline.push({
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    message: `<div style="max-width:650px;margin:auto;text-align:center;line-height:1.6;color:#0f172a;">
      <p><strong>Bienvenue dans cette étude !</strong></p>
      <p>Pour la validité des mesures, installez-vous à environ 50 à 60 cm de votre écran et activez le son de votre ordinateur.</p>
      <p>L'expérience va démarrer en plein écran.</p>
    </div>`,
    button_label: "Passer en plein écran"
  });

  // Démographie
  timeline.push({
    type: jsPsychSurveyMultiChoice,
    questions: [{ prompt: "Quel est votre sexe ?", options: ["Homme", "Femme", "Non-binaire", "Autre", "Préfère ne pas répondre"], required: true }],
    button_label: "Valider",
    on_finish: function (data) { data.participant_sex = data.response.Q0; }
  });

  timeline.push({
    type: jsPsychSurveyMultiChoice,
    questions: [{ prompt: "Quelle est votre tranche d'âge ?", options: ["Moins de 18 ans", "18-25 ans", "26-35 ans", "36-50 ans", "51 ans et plus"], required: true }],
    button_label: "Valider",
    on_finish: function (data) { data.participant_age = data.response.Q0; }
  });

  // Test auditif
  const AUDIO_TEST_TRIALS = 10;
  const AUDIO_TEST_THRESHOLD = 7;
  let audioTestCorrect = 0;
  let audioTestIndex = 0;
  let audioTestSequence = [];
  let audioTestPassed = false;

  function generateAudioTestSequence() {
    const seq = [];
    for (let i = 0; i < AUDIO_TEST_TRIALS / 2; i++) { seq.push('high'); seq.push('low'); }
    for (let i = seq.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [seq[i], seq[j]] = [seq[j], seq[i]];
    }
    return seq;
  }

  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <p><strong>Test de perception auditive</strong></p>
      <p>Nous vérifions d'abord que vous entendez et distinguez les deux sons utilisés dans l'expérience :</p>
      <div style="display:flex;gap:32px;justify-content:center;align-items:stretch;margin:24px 0;">
        <div style="padding:20px 28px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;min-width:140px;">
          <p><strong>Son Grave 🔽</strong></p>
          <button id="playLow" type="button" class="jspsych-btn" style="background:#64748b;">🔊 Écouter</button>
        </div>
        <div style="padding:20px 28px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;min-width:140px;">
          <p><strong>Son Aigu 🔼</strong></p>
          <button id="playHigh" type="button" class="jspsych-btn" style="background:#2563eb;">🔊 Écouter</button>
        </div>
      </div>
      <p style="color:#64748b;font-size:0.9em;">Ajustez votre volume sonore, puis commencez le test.</p>
    `,
    choices: ["Démarrer le test sonore"],
    on_load: function () {
      document.getElementById("playLow").addEventListener("click", (e) => { e.stopPropagation(); playPitch(false); });
      document.getElementById("playHigh").addEventListener("click", (e) => { e.stopPropagation(); playPitch(true); });
    },
    on_finish: function () {
      audioTestCorrect = 0; audioTestIndex = 0;
      audioTestSequence = generateAudioTestSequence();
    }
  });

  const audioTestBlock = {
    timeline: [
      {
        type: jsPsychHtmlButtonResponse,
        stimulus: () => `<p>Son ${audioTestIndex + 1} / ${AUDIO_TEST_TRIALS}</p><p>Cliquez ci-dessous pour entendre le son.</p>`,
        choices: ["🔊 Écouter le son"],
        on_finish: () => { playPitch(audioTestSequence[audioTestIndex] === 'high'); }
      },
      {
        type: jsPsychHtmlButtonResponse,
        stimulus: () => `<p>Son ${audioTestIndex + 1} / ${AUDIO_TEST_TRIALS}</p><p>Était-ce un son <strong>grave</strong> ou <strong>aigu</strong> ?</p>`,
        choices: ["Grave 🔽", "Aigu 🔼"],
        on_finish: function (data) {
          const responded = data.response === 0 ? 'low' : 'high';
          const correct = audioTestSequence[audioTestIndex];
          if (responded === correct) audioTestCorrect++;
          audioTestIndex++;
        }
      }
    ],
    loop_function: () => audioTestIndex < AUDIO_TEST_TRIALS
  };

  timeline.push(audioTestBlock);

  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: () => {
      audioTestPassed = audioTestCorrect >= AUDIO_TEST_THRESHOLD;
      return audioTestPassed
        ? `<p>✅ <strong>Bravo !</strong> Score : ${audioTestCorrect}/${AUDIO_TEST_TRIALS}. Vous pouvez continuer.</p>`
        : `<p>⚠️ <strong>Score : ${audioTestCorrect}/${AUDIO_TEST_TRIALS}</strong>. Pensez à augmenter le volume sonore avant de continuer.</p>`;
    },
    choices: ["Continuer"]
  });

  // Démo et instructions
  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <p><strong>Consignes de la tâche</strong></p>
      <p>4 disques vont se déplacer sur l'écran et rebondir contre les bords : 2 sont rapides et 2 sont lents.</p>
      <p>À chaque rebond, un son est joué (grave ou aigu aléatoirement).</p>
      <p><strong>Vous devez compter UNIQUEMENT les rebonds des disques RAPIDES qui émettent un son AIGU.</strong></p>
      <p>Les disques lents et les sons graves ne doivent pas être comptés !</p>
    `,
    choices: ["Commencer l'entraînement"]
  });

  // Fonction d'animation du tracking
  function buildTrackingTrial(config) {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<canvas id="animationCanvas" width="800" height="600" style="width:800px;height:600px;border:1px solid #222;display:block;margin:auto;background-color:#525252;"></canvas>`,
      choices: "NO_KEYS",
      trial_duration: config.duration_ms,
      data: { trial_number: config.trial_number, is_training: config.is_training || false },
      on_load: function () {
        const canvas = document.getElementById("animationCanvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const baseR = BASE_RADIUS;
        let rebTarget = 0, isRunning = false;

        const shapes = [];
        for (let j = 0; j < 4; j++) {
          const fast = j >= 2;
          const speed = fast ? 200 : 80;
          const angle = Math.random() * 2 * Math.PI;
          shapes.push({
            x: canvas.width / 2 + (Math.random() - 0.5) * baseR * 2,
            y: canvas.height / 2 + (Math.random() - 0.5) * baseR * 2,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            radius: baseR,
            group: fast ? 2 : 1,
            pitch: Math.random() < 0.5 ? 'high' : 'low',
            lastRebound: null
          });
        }

        const unexpected = {
          x: canvas.width + BASE_RADIUS + 5,
          y: canvas.height / 2,
          speed: unexpectedSpeed
        };

        function onRebound(shape, currentPitch) {
          if (shape.group === 2 && currentPitch === 'high') rebTarget++;
        }

        let startTime = performance.now();
        let lastFrame = startTime;

        function update(dt, elapsed) {
          shapes.forEach(s => {
            s.x += s.dx * dt; s.y += s.dy * dt;
            if (s.x - s.radius / 2 <= 0) {
              s.x = s.radius / 2;
              if (s.lastRebound !== "left") { s.dx *= -1; handleRebound(s, onRebound); s.lastRebound = "left"; }
            } else if (s.x + s.radius / 2 >= canvas.width) {
              s.x = canvas.width - s.radius / 2;
              if (s.lastRebound !== "right") { s.dx *= -1; handleRebound(s, onRebound); s.lastRebound = "right"; }
            } else { if (s.lastRebound === "left" || s.lastRebound === "right") s.lastRebound = null; }

            if (s.y - s.radius / 2 <= 0) {
              s.y = s.radius / 2;
              if (s.lastRebound !== "top") { s.dy *= -1; handleRebound(s, onRebound); s.lastRebound = "top"; }
            } else if (s.y + s.radius / 2 >= canvas.height) {
              s.y = canvas.height - s.radius / 2;
              if (s.lastRebound !== "bottom") { s.dy *= -1; handleRebound(s, onRebound); s.lastRebound = "bottom"; }
            } else { if (s.lastRebound === "top" || s.lastRebound === "bottom") s.lastRebound = null; }
          });

          if (config.allowUS && hasUnexpected && elapsed > 10000) {
            unexpected.x += unexpected.speed * dt;
          }
        }

        function draw(elapsed) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "black";
          shapes.forEach(s => {
            ctx.beginPath(); ctx.arc(s.x, s.y, s.radius / 2, 0, Math.PI * 2);
            ctx.fill();
          });

          if (config.allowUS && hasUnexpected && elapsed > 10000) {
            let r = BASE_RADIUS / 2;
            if (unexpectedSizeMode === 'pulsing') {
              r = (BASE_RADIUS * (1 + PULSE_AMPLITUDE * Math.sin(2 * Math.PI * PULSE_FREQ * (elapsed / 1000)))) / 2;
            }
            ctx.fillStyle = unexpectedColor;
            if (unexpectedShape === 'circle') {
              ctx.beginPath(); ctx.arc(unexpected.x, unexpected.y, r, 0, Math.PI * 2); ctx.fill();
            } else if (unexpectedShape === 'triangle') {
              ctx.beginPath();
              ctx.moveTo(unexpected.x, unexpected.y - r * 1.3);
              ctx.lineTo(unexpected.x - r * 1.15, unexpected.y + r * 0.75);
              ctx.lineTo(unexpected.x + r * 1.15, unexpected.y + r * 0.75);
              ctx.closePath();
              ctx.fill();
            }
          }

          ctx.fillStyle = "black"; ctx.font = "40px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("+", canvas.width / 2, canvas.height / 2);
        }

        function loop(now) {
          if (!isRunning) return;
          const dt = Math.min((now - lastFrame) / 1000, 0.05);
          lastFrame = now;
          const elapsed = now - startTime;
          update(dt, elapsed);
          draw(elapsed);
          requestAnimationFrame(loop);
        }

        setTimeout(() => {
          isRunning = true; startTime = performance.now(); lastFrame = startTime;
          requestAnimationFrame(loop);
        }, 500);

        setTimeout(() => { isRunning = false; }, config.duration_ms - 500);

        window._currentTrialRebounds = () => rebTarget;
      },
      on_finish: function (data) {
        if (window._currentTrialRebounds) {
          data.true_rebounds = window._currentTrialRebounds();
          window._currentTrialRebounds = null;
        }
      }
    };
  }

  // 2 essais d'entraînement
  for (let trainIdx = 1; trainIdx <= 2; trainIdx++) {
    timeline.push(buildTrackingTrial({ trial_number: `train_${trainIdx}`, is_training: true, allowUS: false, duration_ms: 20000 }));

    timeline.push({
      type: jsPsychSurveyText,
      preamble: `<p>Combien de rebonds de disques <strong>rapides</strong> avec un son <strong>aigu</strong> avez-vous compté ?</p>`,
      questions: [{ prompt: "Nombre :", required: true }],
      button_label: "Valider",
      on_finish: function (data) {
        const lastTrial = jsPsych.data.get().filter({ is_training: true }).last(1).values()[0];
        const trueCount = lastTrial ? lastTrial.true_rebounds : 0;
        const rep = parseInt(data.response.Q0, 10) || 0;
        data.participant_rebound_count = rep;
        data.true_rebounds = trueCount;
      }
    });
  }

  // 5 essais expérimentaux
  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `<p>L'entraînement est terminé. Les essais suivants dureront <strong>30 secondes</strong>.</p>`,
    choices: ["Démarrer l'expérience"]
  });

  for (let t = 1; t <= 5; t++) {
    timeline.push({
      type: jsPsychHtmlButtonResponse,
      stimulus: `<p>${t < 5 ? "<strong>Prêt pour l'essai suivant ?</strong>" : "Consigne modifiée : Observez simplement l'écran, <strong>plus besoin de compter les rebonds.</strong>"}</p>`,
      choices: ["Continuer"]
    });

    const hasUSTrial = (t >= 3);
    timeline.push(buildTrackingTrial({ trial_number: t, is_training: false, allowUS: hasUSTrial, duration_ms: 30000 }));

    if (t < 5) {
      timeline.push({
        type: jsPsychSurveyText,
        preamble: `<p>Combien de rebonds de disques rapides avec un son aigu avez-vous compté ?</p>`,
        questions: [{ prompt: "Nombre de rebonds :", required: true }],
        button_label: "Valider",
        data: { trial_number: t, question_type: "rebound_count" },
        on_finish: function (data) {
          data.participant_rebound_count = parseInt(data.response.Q0, 10) || 0;
        }
      });
    }

    if (t >= 3) {
      timeline.push({
        type: jsPsychSurveyMultiChoice,
        questions: [{ prompt: "Avez-vous remarqué quelque chose d'inhabituel lors de cet essai ?", options: ["OUI", "NON"], required: true }],
        data: { trial_number: t, question_type: "detection_ib" },
        on_finish: function (data) { data.participant_response_ib = data.response.Q0; }
      });

      timeline.push({
        type: jsPsychHtmlSliderResponse,
        stimulus: "Indiquez votre certitude quant à votre réponse OUI / NON :",
        labels: ["Pas du tout certain·e", "Totalement certain·e"],
        min: 0, max: 100, step: 1, slider_start: 50, require_movement: true,
        data: { trial_number: t, question_type: "confidence_detection" },
        on_finish: function (data) { data.confidence_detection = data.response; }
      });
    }
  }

  // Question de connaissance préalable
  timeline.push({
    type: jsPsychSurveyMultiChoice,
    questions: [{ prompt: "Connaissiez-vous déjà ce type d'expérience (ex. le gorille invisible) ?", options: ["Oui", "Non"], required: true }],
    button_label: "Terminer",
    on_finish: function (data) { data.participant_prior_knowledge = data.response.Q0; }
  });

  // Sauvegarde Firebase
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="max-width:600px;margin:auto;text-align:center;padding-top:40px;color:#0f172a;">
      <h2>Merci pour votre participation !</h2>
      <p id="save-status">Enregistrement des données sur le serveur, veuillez patienter...</p>
    </div>`,
    choices: "NO_KEYS",
    trial_duration: 3000,
    on_load: function () {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      const experimentData = jsPsych.data.get().values();

      if (db) {
        db.ref("experiment_data/" + subject_id).set(experimentData)
          .then(() => {
            const el = document.getElementById("save-status");
            if (el) el.innerHTML = "✅ Données enregistrées ! Redirection en cours...";
            setTimeout(() => { window.location.href = "https://www.univ-tlse2.fr/"; }, 1500);
          })
          .catch(() => {
            setTimeout(() => { window.location.href = "https://www.univ-tlse2.fr/"; }, 2000);
          });
      } else {
        setTimeout(() => { window.location.href = "https://www.univ-tlse2.fr/"; }, 1500);
      }
    }
  });

  // Démarrage de jsPsych
  jsPsych.run(timeline);
});
