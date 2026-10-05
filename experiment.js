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

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// Identifiant sujet unique et anonyme
const subject_id = "sub_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

// ─── DÉTECTION MOBILE ROBUSTE (COMPATIBLE PC PORTABLES TACTILES) ────────────
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

// ─── BLOCAGE IMMÉDIAT EN CAS D'APPAREIL MOBILE / TABLETTE ───────────────────
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
} else {

  // ─── INITIALISATION JSPSYCH ────────────────────────────────────────────────
  var jsPsych = initJsPsych({
    use_webaudio: false,
    on_interaction_data_update: function (data) {
      if (data.event === "blur" || data.event === "fullscreenexit") {
        console.warn("Attention : focus perdu ou plein écran quitté à t=" + data.time);
      }
    }
  });

  var timeline = [];

  // ─── US CONDITIONS ─────────────────────────────────────────────────────────
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

  // ─── AUDIO ENGINE ──────────────────────────────────────────────────────────
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  document.addEventListener('click', () => { getAudioCtx(); });

  function playPitch(isHigh) {
    try {
      const ctx = getAudioCtx();
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
    } catch (e) { /* lecture audio non disponible */ }
  }

  function handleRebound(shape, onRebound) {
    const currentPitch = shape.pitch;
    playPitch(currentPitch === 'high');
    if (onRebound) onRebound(shape, currentPitch);
    shape.pitch = Math.random() < 0.5 ? 'high' : 'low';
  }

  // ─── ESTIMATION DU REFRESH RATE ────────────────────────────────────────────
  let refreshRate = 60, frameCount = 0, lastTime = performance.now();
  function estimateRefreshRate() {
    const now = performance.now(); frameCount++;
    if (now - lastTime >= 1000) { refreshRate = frameCount; frameCount = 0; lastTime = now; }
    requestAnimationFrame(estimateRefreshRate);
  }
  requestAnimationFrame(estimateRefreshRate);

  // ─── 0. CONSENTEMENT LIBRE ET ÉCLAIRÉ ───────────────────────────────────────
  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div style="max-width:780px;margin:20px auto;text-align:left;line-height:1.55;font-size:0.88rem;background:#f8fafc;padding:24px;border-radius:12px;border:1px solid #cbd5e1;max-height:70vh;overflow-y:auto;color:#1e293b;">
        <h2 style="text-align:center;font-size:1.25rem;margin-top:0;color:#0f172a;">Formulaire d'information et de consentement libre et éclairé</h2>
        
        <p>Avant d’accepter de participer à ce projet de recherche, veuillez prendre le temps de lire et de comprendre les renseignements qui suivent. Ce document vous explique le but de ce projet de recherche, ses procédures, avantages, risques et inconvénients. Nous vous rappelons que vous pouvez interrompre votre participation à l'étude à tout moment sans avoir à vous justifier. Un refus de participer n'aura aucune conséquence sur votre relation avec l'équipe de recherche qui la propose.</p>
        
        <p style="background:rgba(46,204,113,0.15);padding:8px 12px;border-radius:6px;border-left:4px solid #2ecc71;">
          <strong>Avis éthique :</strong> Cette étude a reçu un avis favorable du Comité d’Éthique de la Recherche de Toulouse (avis n° 2026_1242, en date du 18/02/2026).
        </p>

        <p><strong>Responsable scientifique du projet :</strong><br>
        Pr Céline Lemercier, Laboratoire CLLE & CNRS, Université Jean Jaurès, 5 allée Antonio Machado 31058 Toulouse cedex 9 (<a href="mailto:celine.lemercier@univ-tlse2.fr" style="color:#2563eb;">celine.lemercier@univ-tlse2.fr</a>)<br>
        <strong>Lieu de recherche :</strong> Université Toulouse Jean Jaurès, laboratoire CLLE.</p>

        <p><strong>But du projet de recherche :</strong><br>
        Ce projet vise à étudier quels sont les paramètres du stimulus qui permettent d’améliorer sa perception.</p>

        <p><strong>Ce que l’on attend de vous (méthodologie) :</strong><br>
        Si vous acceptez de participer à cette étude, vous effectuerez d'abord un court test auditif. Vous serez ensuite invité·e à compter le nombre de rebonds de formes se déplaçant à l'écran lorsqu'elles émettent un signal sonore spécifique. Vous aurez 5 essais de 30 secondes. L’expérience dure en tout environ 15 minutes.</p>

        <p><strong>Vos droits de vous retirer de la recherche en tout temps :</strong><br>
        1. Votre contribution à cette recherche est volontaire.<br>
        2. Vous pouvez cesser votre participation à tout moment, et cela n’aura aucune conséquence. Cependant, lorsque votre participation sera terminée, il ne sera plus possible de retirer vos données en raison de leur strict anonymat.</p>

        <p><strong>Confidentialité et respect de la vie privée :</strong><br>
        Cette étude est strictement anonyme : aucune donnée nominative n'est collectée.<br>
        1. Les données obtenues seront traitées avec la plus entière confidentialité.<br>
        2. Aucun renseignement ne sera dévoilé qui puisse révéler votre identité.<br>
        3. Les données seront conservées dans un environnement sécurisé.</p>

        <p><strong>Bénéfices :</strong><br>
        • <em>Avancées scientifiques :</em> éclairage sur les paramètres du stimulus déterminants dans le taux de capture attentionnelle.<br>
        • <em>Pour la société :</em> compréhension des mécanismes d'attention dans des environnements dynamiques (aéronautique, conduite automobile).<br>
        • <em>Pour le participant :</em> contribution à l'avancée de la recherche.</p>

        <p><strong>Risques possibles :</strong><br>
        Cette recherche n’implique aucun risque ou inconfort autre que ceux de la vie quotidienne face à un écran d'ordinateur.</p>

        <p><strong>Contacts :</strong><br>
        • Protection des données (DPO) : <a href="mailto:dr14-rgpd@cnrs.fr" style="color:#2563eb;">dr14-rgpd@cnrs.fr</a><br>
        • Comité d’Éthique de la Recherche (CER) : <a href="mailto:bureau-cer@univ-toulouse.fr" style="color:#2563eb;">bureau-cer@univ-toulouse.fr</a></p>
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
          <p>Vous avez choisi de ne pas participer à cette étude. Aucune donnée n'a été enregistrée.</p>
          <p>Redirection en cours...</p>
        </div>`);
        setTimeout(() => {
          window.location.href = "https://www.univ-tlse2.fr/";
        }, 2000);
      }
    }
  });

  // ─── 1. PLEIN ÉCRAN ─────────────────────────────────────────────────────────
  timeline.push({
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    message: `<div style="max-width:650px;margin:auto;text-align:center;line-height:1.6;color:#0f172a;">
      <p><strong>Bienvenue dans cette étude !</strong></p>
      <p>Pour la validité des mesures, installez-vous confortablement à <strong>environ 50 à 60 cm de votre écran</strong> et ajustez le volume sonore de votre ordinateur.</p>
      <p>L'expérience va démarrer en plein écran.</p>
    </div>`,
    button_label: "Passer en plein écran",
    data: { speedcondition }
  });

  // ─── 2. QUESTIONS DÉMOGRAPHIQUES ────────────────────────────────────────────
  timeline.push({
    type: jsPsychSurveyMultiChoice,
    questions: [{ prompt: "Quel est votre sexe ?", options: ["Homme", "Femme", "Non-binaire", "Autre", "Préfère ne pas répondre"], required: true }],
    button_label: "Valider",
    data: { question_type: "sex", speedcondition },
    on_finish: function (data) { data.participant_sex = data.response.Q0; }
  });

  timeline.push({
    type: jsPsychSurveyMultiChoice,
    questions: [{ prompt: "Quelle est votre tranche d'âge ?", options: ["Moins de 18 ans", "18-25 ans", "26-35 ans", "36-50 ans", "51 ans et plus"], required: true }],
    button_label: "Valider",
    data: { question_type: "age", speedcondition },
    on_finish: function (data) { data.participant_age = data.response.Q0; }
  });

  // ─── 3. TEST AUDITIF (SCREENING) ───────────────────────────────────────────
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

  // Familiarisation sonore
  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <p><strong>Test de perception auditive</strong></p>
      <p>Avant de démarrer la tâche visuelle, nous vérifions que vous entendez et distinguez bien les deux sons de l'expérience.</p>
      <p>Cliquez sur chaque bouton pour écouter les deux sons :</p>
      <div style="display:flex;gap:32px;justify-content:center;align-items:stretch;margin:24px 0;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px 28px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;min-width:140px;">
          <span style="font-size:1em;font-weight:bold;color:#333;">Son Grave</span>
          <span style="font-size:2em;">🔽</span>
          <button id="playLow" type="button" class="jspsych-btn" style="background:#64748b;font-size:0.95em;">🔊 Écouter</button>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px 28px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;min-width:140px;">
          <span style="font-size:1em;font-weight:bold;color:#333;">Son Aigu</span>
          <span style="font-size:2em;">🔼</span>
          <button id="playHigh" type="button" class="jspsych-btn" style="background:#2563eb;font-size:0.95em;">🔊 Écouter</button>
        </div>
      </div>
      <p style="color:#64748b;font-size:0.9em;">Vérifiez que le volume de votre ordinateur est suffisant. Quand vous êtes prêt·e, cliquez ci-dessous.</p>
    `,
    choices: ["Démarrer le test sonore"],
    data: { phase: "audio_familiarization", speedcondition },
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
        stimulus: function () {
          const isRetry = audioTestSequence.length > 0;
          return `
            <p><strong>${isRetry ? "Nouveau test auditif" : "Test auditif"}</strong></p>
            <p>Vous allez entendre <strong>${AUDIO_TEST_TRIALS} sons</strong> consécutifs.<br>
            Pour chaque son, cliquez sur <strong>Écouter le son</strong>, puis indiquez s'il est <strong>grave 🔽</strong> ou <strong>aigu 🔼</strong>.</p>
            ${isRetry ? `<p style="color:#e11d48;">Ajustez votre volume si besoin avant de commencer.</p>` : ""}
          `;
        },
        choices: ["C'est parti !"],
        data: { phase: "audio_test_intro", speedcondition },
        on_finish: function () {
          audioTestCorrect = 0; audioTestIndex = 0;
          audioTestSequence = generateAudioTestSequence();
        }
      },
      {
        timeline: [
          {
            type: jsPsychHtmlButtonResponse,
            stimulus: function () {
              return `<p>Son ${audioTestIndex + 1} / ${AUDIO_TEST_TRIALS}</p><p>Cliquez pour jouer le son.</p>`;
            },
            choices: ["🔊 Écouter le son"],
            data: { phase: "audio_test_play", speedcondition },
            on_finish: function () {
              playPitch(audioTestSequence[audioTestIndex] === 'high');
            }
          },
          {
            type: jsPsychHtmlButtonResponse,
            stimulus: function () {
              return `<p>Son ${audioTestIndex + 1} / ${AUDIO_TEST_TRIALS}</p><p>Ce son était-il <strong>grave</strong> ou <strong>aigu</strong> ?</p>`;
            },
            choices: ["Grave 🔽", "Aigu 🔼"],
            data: { phase: "audio_test_response", speedcondition },
            on_finish: function (data) {
              const responded = data.response === 0 ? 'low' : 'high';
              const correct = audioTestSequence[audioTestIndex];
              data.audio_test_response = responded;
              data.audio_test_correct_pitch = correct;
              data.audio_test_is_correct = (responded === correct);
              if (data.audio_test_is_correct) audioTestCorrect++;
              audioTestIndex++;
            }
          }
        ],
        loop_function: function () { return audioTestIndex < AUDIO_TEST_TRIALS; }
      },
      {
        type: jsPsychHtmlButtonResponse,
        stimulus: function () {
          if (audioTestCorrect >= AUDIO_TEST
