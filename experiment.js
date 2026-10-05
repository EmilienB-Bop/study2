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
  return !(isMobileUA || isMobileDimensions || isIPad);
}

if (!isComputer()) {
  document.body.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px;text-align:center;font-family:sans-serif;color:#0f172a;background:#fff;">
      <div style="max-width:480px;background:#f8fafc;border:1px solid #cbd5e1;padding:30px 20px;border-radius:16px;">
        <div style="font-size:3rem;margin-bottom:12px;">💻</div>
        <h2>Appareil non compatible</h2>
        <p>Pour passer cette expérience, il vous faut impérativement être sur un ordinateur (clavier et souris).</p>
        <p>Merci de renouveler l'expérience depuis un ordinateur.</p>
        <button onclick="window.location.href='https://www.univ-tlse2.fr/'" style="padding:12px 24px;font-weight:600;color:#fff;background:#2563eb;border:none;border-radius:8px;cursor:pointer;">Quitter</button>
      </div>
    </div>
  `;
} else {

  const jsPsych = initJsPsych({
    use_webaudio: false
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
    subject_id: subject_id,
    variant: selectedVariant,
    us_shape: unexpectedShape,
    us_color: unexpectedColor,
    us_size_mode: unexpectedSizeMode,
    has_unexpected: hasUnexpected,
    speedcondition: speedcondition,
    unexpected_speed_px: unexpectedSpeed
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
      gain.gain.setValueAtTime(isHigh ? 0.2 : 0.6, ctx.currentTime);
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

  // ─── 0. NOTICE D'INFORMATION ET DE CONSENTEMENT COMPLÈTE ──────────────────
  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div style="max-width:780px;margin:20px auto;text-align:left;line-height:1.55;font-size:0.88rem;background:#f8fafc;padding:24px;border-radius:12px;border:1px solid #cbd5e1;max-height:70vh;overflow-y:auto;color:#1e293b;">
        <h2 style="text-align:center;font-size:1.25rem;margin-top:0;color:#0f172a;">Notice d'information et consentement libre et éclairé</h2>
        
        <p>Avant d’accepter de participer à ce projet de recherche, veuillez prendre le temps de lire et de comprendre les renseignements qui suivent. Ce document vous explique le but de ce projet de recherche, ses procédures, avantages, risques et inconvénients. Nous vous rappelons que vous pouvez interrompre votre participation à l'étude à tout moment sans avoir à vous justifier. Un refus de participer n'aura aucune conséquence sur votre relation avec l'équipe de recherche qui la propose.</p>
        
        <p style="background:rgba(46,204,113,0.15);padding:8px 12px;border-radius:6px;border-left:4px solid #2ecc71;">
          <strong>Avis éthique :</strong> Cette étude a reçu un avis favorable du Comité d’Éthique de la Recherche de Toulouse (avis n° 2026_1242, en date du 18/02/2026).
        </p>

        <p><strong>Chercheur titulaire responsable scientifique du projet :</strong><br>
        Pr Céline Lemercier, Laboratoire CLLE & CNRS, Université Jean Jaurès, 5 allée Antonio Machado 31058 Toulouse cedex 9, <a href="mailto:celine.lemercier@univ-tlse2.fr" style="color:#2563eb;">celine.lemercier@univ-tlse2.fr</a><br>
        <strong>Lieu de recherche :</strong> Université Toulouse Jean Jaurès, laboratoire CLLE.</p>

        <p><strong>But du projet de recherche :</strong> Ce projet vise à étudier quels sont les paramètres du stimulus qui permettent d’améliorer sa perception.</p>

        <p><strong>Ce que l’on attend de vous (méthodologie) :</strong><br>
        Si vous acceptez de participer à cette étude, vous êtes invité·e à répondre à quelques questions puis à compter le nombre de rebonds de formes qu’on vous aura préalablement décrites contre les bords de l’écran. Vous aurez 5 essais de 30 secondes pendant lesquels des formes se déplaceront sur l’écran en rebondissant contre les bords. On vous demandera de compter les rebonds d’un groupe précis de ces objets. L’expérience dure en tout 15 minutes (en incluant la lecture du présent consentement et le débriefing).</p>

        <p><strong>Vos droits de vous retirer de la recherche en tout temps :</strong><br>
        1. Votre contribution à cette recherche est volontaire ;<br>
        2. Vous pouvez cesser votre participation à tout moment, et cela n’aura aucune conséquence. Cependant, lorsque votre participation sera terminée, il ne sera plus possible de la retirer. En effet, la stricte confidentialité de cette étude rend impossible la rectification ou la suppression des informations vous concernant, vu que nous ne pourrons pas identifier votre réponse parmi les réponses reçues.</p>

        <p><strong>Vos droits à la confidentialité et au respect de la vie privée :</strong><br>
        Cette étude est strictement anonyme, c'est-à-dire que les données collectées ne permettront pas de vous identifier, même indirectement, de quelque manière que ce soit.<br>
        1. Les données obtenues seront traitées avec la plus entière confidentialité.<br>
        2. Aucun renseignement ne sera dévoilé qui puisse révéler votre identité.<br>
        3. Les données seront conservées dans un endroit sécurisé (seul le responsable de l'étude y aura accès).</p>

        <p><strong>Bénéfices :</strong><br>
        • <em>Bénéfices en termes d’avancées scientifiques :</em> L’étude va permettre d’apporter un éclairage sur les paramètres du stimulus déterminants dans le taux de capture attentionnelle.<br>
        • <em>Bénéfices pour la société :</em> La détermination des paramètres du stimulus impactant le taux de capture attentionnelle a d’importants bénéfices possibles dans tous les domaines complexes où l’attention est sollicitée et des événements complexes sont susceptibles de se produire. C’est le cas dans l’aviation, dans la conduite automobile par exemple.<br>
        • <em>Bénéfices pour le participant :</em> La satisfaction profonde de participer à l’avancée de la science.</p>

        <p><strong>Risques possibles :</strong><br>
        À notre connaissance, cette recherche n’implique aucun risque ou inconfort autre que ceux de la vie quotidienne.</p>

        <p><strong>Diffusion :</strong><br>
        Cette recherche sera diffusée dans des colloques et elle sera publiée dans des actes de colloque et des articles de revue académique. Vous pourrez prendre connaissance des résultats généraux de la présente étude en contactant le responsable scientifique de l’étude Pr Céline Lemercier.</p>

        <p><strong>Vos droits de poser des questions en tout temps :</strong><br>
        Si vous avez des questions relatives à la protection de vos données, merci de contacter le DPO de l’établissement (<a href="mailto:dr14-rgpd@cnrs.fr" style="color:#2563eb;">dr14-rgpd@cnrs.fr</a>).<br>
        Si vous avez des questions relatives à l’éthique du projet, vous pouvez contacter le Comité d’Éthique de la Recherche de Toulouse (<a href="mailto:bureau-cer@univ-toulouse.fr" style="color:#2563eb;">bureau-cer@univ-toulouse.fr</a>).</p>
      </div>
    `,
    choices: ["Je refuse de participer", "J'ai lu, compris et j'accepte de participer"],
    button_html: [
      '<button class="jspsych-btn" style="background:#64748b;color:#fff;margin:8px;">%choice%</button>',
      '<button class="jspsych-btn" style="background:#2563eb;color:#fff;font-weight:bold;margin:8px;">%choice%</button>'
    ],
    on_finish: function (data) {
      if (data.response === 0) {
        document.body.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:20px;text-align:center;font-family:sans-serif;color:#0f172a;background:#fff;">
            <h2>Participation annulée</h2>
            <p>Vous avez choisi de ne pas participer à cette étude. Aucune donnée n'a été enregistrée.</p>
            <p style="color:#64748b;">Redirection en cours vers l'université...</p>
          </div>
        `;
        setTimeout(() => {
          window.location.href = "https://www.univ-tlse2.fr/";
        }, 1500);
      }
    }
  });

  // ─── 1. PLEIN ÉCRAN ─────────────────────────────────────────────────────────
  timeline.push({
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    message: `<div style="max-width:650px;margin:auto;text-align:center;line-height:1.6;">
      <p><strong>Bienvenue dans cette étude !</strong></p>
      <p>Pour la validité des mesures, merci de vous installer confortablement à <strong>environ une longueur de bras de votre écran</strong> (50 à 60 cm) et d'activer le son de votre ordinateur.</p>
      <p>L'expérience va démarrer en plein écran.</p>
    </div>`,
    button_label: "Passer en plein écran"
  });

  // ─── 2. DÉMOGRAPHIE (ALIGNÉE VERTICALEMENT) ─────────────────────────────────
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

  // ─── 3. TEST AUDITIF ────────────────────────────────────────────────────────
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

  // Écran de familiarisation : deux boutons bleus identiques
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
          <button id="playLow" type="button" class="jspsych-btn" style="background:#2563eb;font-size:0.95em;">🔊 Écouter</button>
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
    on_load: function () {
      document.getElementById("playLow").addEventListener("click", (e) => { e.stopPropagation(); playPitch(false); });
      document.getElementById("playHigh").addEventListener("click", (e) => { e.stopPropagation(); playPitch(true); });
    },
    on_finish: function () {
      audioTestCorrect = 0; audioTestIndex = 0;
      audioTestSequence = generateAudioTestSequence();
    }
  });

  // Consigne simple avant la série
  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <p><strong>Consigne pour le test sonore :</strong></p>
      <p>Vous allez entendre 10 sons successifs : écoutez chaque son, puis indiquez s'il est grave ou aigu.</p>
    `,
    choices: ["Commencer les 10 écoutes"]
  });

  const audioTestBlock = {
    timeline: [
      {
        type: jsPsychHtmlButtonResponse,
        stimulus: () => `<p>Son ${audioTestIndex + 1} /${AUDIO_TEST_TRIALS}</p><p>Cliquez pour jouer le son.</p>`,
        choices: ["🔊 Écouter le son"],
        on_finish: () => { playPitch(audioTestSequence[audioTestIndex] === 'high'); }
      },
      {
        type: jsPsychHtmlButtonResponse,
        stimulus: () => `<p>Son ${audioTestIndex + 1} /${AUDIO_TEST_TRIALS}</p><p>Ce son était-il <strong>grave</strong> ou <strong>aigu</strong> ?</p>`,
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

  // ─── 4. DÉMONSTRATION AVEC CANVA ET HALO DORÉ ──────────────────────────────
  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <p><strong>Consignes de la tâche</strong></p>
      <p>4 disques vont se déplacer sur l'écran et rebondir contre les parois : 2 sont rapides et 2 sont lents.</p>
      <p>Chaque fois qu'un disque heurte un bord, il émet un <strong>son</strong>, soit <strong>grave</strong>, soit <strong>aigu</strong> aléatoirement.</p>
      <p><strong>Votre tâche : compter attentivement les rebonds des disques RAPIDES qui émettent un son AIGU,<br>
      et indiquer le total à la fin de chaque essai.</strong></p>
      <p>Les disques lents et les sons graves ne sont là que pour vous distraire !</p>
      <p>Voici un aperçu : les 2 rapides clignotent <span style="color:red;">en rouge</span> et les 2 lents <span style="color:lightgreen;">en vert</span>.<br>
      Un <span style="color:#FFD700;font-weight:bold;">halo doré</span> apparaît autour des disques rapides uniquement lorsqu'ils émettent un son aigu.</p>
      <canvas id="welcomeCanvas" style="width:400px;height:300px;border:1px solid #222;display:block;margin:10px auto;"></canvas>

      <div id="soundToggleBox" style="margin:14px auto 0;padding:10px 18px;border:1px solid #94a3b8;border-radius:8px;background:#f1f5f9;display:inline-block;text-align:center;cursor:pointer;user-select:none;">
        <span id="soundToggleLabel" style="font-size:0.95em;color:#334155;">🔇 Activer le son de la démo</span>
      </div>
    `,
    choices: ["J'ai compris"],
    on_load: function () {
      let soundEnabled = false;
      const toggleBox = document.getElementById("soundToggleBox");
      const toggleLabel = document.getElementById("soundToggleLabel");
      toggleBox.addEventListener("click", () => {
        soundEnabled = !soundEnabled;
        toggleLabel.textContent = soundEnabled ? "🔊 Son activé (cliquez pour couper)" : "🔇 Activer le son de la démo";
      });

      const canvas = document.getElementById("welcomeCanvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 400; canvas.height = 300;
      canvas.style.backgroundColor = "#525252";
      const baseR = 10;
      const FLASH_DURATION = 400;
      const shapes = [];
      for (let j = 0; j < 4; j++) {
        const fast = j >= 2;
        const speed = fast ? 100 : 40;
        const baseColor = fast ? "red" : "green";
        const angle = Math.random() * 2 * Math.PI;
        shapes.push({
          x: canvas.width / 2 + (Math.random() - 0.5) * baseR * 2,
          y: canvas.height / 2 + (Math.random() - 0.5) * baseR * 2,
          dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed,
          baseColor, color: baseColor, radius: baseR,
          group: fast ? 2 : 1, lastRebound: null,
          pitch: Math.random() < 0.5 ? 'high' : 'low',
          flashUntil: 0
        });
      }
      let isPaused = false, blinkState = true;
      const blinkTimer = setInterval(() => {
        if (isPaused) return;
        blinkState = !blinkState;
        shapes.forEach(s => { s.color = blinkState ? s.baseColor : "black"; });
      }, 500);

      function triggerFlash(s, pitch) {
        if (s.group === 2 && pitch === 'high') s.flashUntil = performance.now() + FLASH_DURATION;
      }

      function update(dt) {
        if (isPaused) return;
        shapes.forEach(s => {
          s.x += s.dx * dt; s.y += s.dy * dt;
          if (s.x - s.radius / 2 <= 0) {
            s.x = s.radius / 2;
            if (s.lastRebound !== "left") { s.dx *= -1; const p = s.pitch; if (soundEnabled) handleRebound(s, null); triggerFlash(s, p); s.lastRebound = "left"; }
          } else if (s.x + s.radius / 2 >= canvas.width) {
            s.x = canvas.width - s.radius / 2;
            if (s.lastRebound !== "right") { s.dx *= -1; const p = s.pitch; if (soundEnabled) handleRebound(s, null); triggerFlash(s, p); s.lastRebound = "right"; }
          } else { if (s.lastRebound === "left" || s.lastRebound === "right") s.lastRebound = null; }

          if (s.y - s.radius / 2 <= 0) {
            s.y = s.radius / 2;
            if (s.lastRebound !== "top") { s.dy *= -1; const p = s.pitch; if (soundEnabled) handleRebound(s, null); triggerFlash(s, p); s.lastRebound = "top"; }
          } else if (s.y + s.radius / 2 >= canvas.height) {
            s.y = canvas.height - s.radius / 2;
            if (s.lastRebound !== "bottom") { s.dy *= -1; const p = s.pitch; if (soundEnabled) handleRebound(s, null); triggerFlash(s, p); s.lastRebound = "bottom"; }
          } else { if (s.lastRebound === "top" || s.lastRebound === "bottom") s.lastRebound = null; }
        });
      }

      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const now = performance.now();
        shapes.forEach(s => {
          if (s.group === 2 && now < s.flashUntil) {
            const progress = 1 - (s.flashUntil - now) / FLASH_DURATION;
            const ringRadius = s.radius / 2 + 4 + progress * 10;
            ctx.beginPath();
            ctx.arc(s.x, s.y, ringRadius, 0, 2 * Math.PI);
            ctx.strokeStyle = `rgba(255,215,0,${1 - progress})`;
            ctx.lineWidth = 3;
            ctx.stroke();
          }
          ctx.beginPath(); ctx.arc(s.x, s.y, s.radius / 2, 0, 2 * Math.PI);
          ctx.fillStyle = s.color; ctx.fill();
        });
        ctx.fillStyle = "black"; ctx.font = "20px Arial"; ctx.textAlign = "center";
        ctx.fillText("+", canvas.width / 2, canvas.height / 2);
      }

      let last = performance.now();
      function animate() {
        if (isPaused) return;
        const now = performance.now(); const dt = (now - last) / 1000; last = now;
        update(dt); draw(); requestAnimationFrame(animate);
      }
      animate();

      document.querySelector(".jspsych-btn").addEventListener("click", () => {
        isPaused = true;
        clearInterval(blinkTimer);
      });
    }
  });

  // ─── SVG HELPERS POUR QUESTIONS IB ─────────────────────────────────────────
  function getShapeSVG(shapeType, size) {
    const s = size || 90;
    const cx = s / 2, cy = s / 2, r = s * 0.33;
    const bg = "#525252";
    if (shapeType === 'circle') {
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s}${s}"><rect width="${s}" height="${s}" fill="${bg}" rx="6"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="black"/></svg>`;
    }
    if (shapeType === 'triangle') {
      const h = r * 1.2;
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s}${s}"><rect width="${s}" height="${s}" fill="${bg}" rx="6"/><polygon points="${cx},${cy - h} ${cx - h},${cy + h * 0.65} ${cx + h},${cy + h * 0.65}" fill="black"/></svg>`;
    }
    return `<svg width="${s}" height="${s}" viewBox="0 0 ${s}${s}"><rect width="${s}" height="${s}" fill="${bg}" rx="6"/><line x1="14" y1="14" x2="${s-14}" y2="${s-14}" stroke="#aaa" stroke-width="3"/><line x1="${s-14}" y1="14" x2="14" y2="${s-14}" stroke="#aaa" stroke-width="3"/><text x="${cx}" y="${s - 10}" text-anchor="middle" fill="#aaa" font-size="11">Rien vu</text></svg>`;
  }

  function getSizeSVG(sizeMode, size) {
    const s = size || 90;
    const cx = s / 2, cy = s / 2, r = s * 0.28;
    const bg = "#525252";
    if (sizeMode === 'fixed') {
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s}${s}"><rect width="${s}" height="${s}" fill="${bg}" rx="6"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="black"/></svg>`;
    }
    if (sizeMode === 'pulsing') {
      const rMin = r * 0.9, rMax = r * 1.1;
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s}${s}"><rect width="${s}" height="${s}" fill="${bg}" rx="6"/><circle cx="${cx}" cy="${cy}" r="${rMax}" fill="none" stroke="black" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.5"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="black"><animate attributeName="r" values="${rMin};${rMax};${rMin}" dur="0.5s" repeatCount="indefinite"/></circle></svg>`;
    }
    return `<svg width="${s}" height="${s}" viewBox="0 0 ${s}${s}"><rect width="${s}" height="${s}" fill="${bg}" rx="6"/><line x1="14" y1="14" x2="${s-14}" y2="${s-14}" stroke="#aaa" stroke-width="3"/><line x1="${s-14}" y1="14" x2="14" y2="${s-14}" stroke="#aaa" stroke-width="3"/><text x="${cx}" y="${s - 10}" text-anchor="middle" fill="#aaa" font-size="11">Rien vu</text></svg>`;
  }

  function appendIBQuestions(trialNumber) {
    // 1. Détection dichotomique
    timeline.push({
      type: jsPsychSurveyMultiChoice,
      questions: [{ prompt: "Avez-vous remarqué quelque chose d'inhabituel lors de cet essai ?", options: ["OUI", "NON"], required: true }],
      data: { trial_number: trialNumber, question_type: "detection_ib" },
      on_finish: function (data) { data.participant_response_ib = data.response.Q0; }
    });

    // 2. Confiance détection
    timeline.push({
      type: jsPsychHtmlSliderResponse,
      stimulus: "Indiquez votre certitude quant à votre réponse OUI / NON :",
      labels: ["Pas du tout certain·e", "Totalement certain·e"],
      min: 0, max: 100, step: 1, slider_start: 50, require_movement: true,
      data: { trial_number: trialNumber, question_type: "confidence_detection" },
      on_finish: function (data) { data.confidence_detection = data.response; }
    });

    // 3. Forme
    timeline.push({
      type: jsPsychHtmlButtonResponse,
      stimulus: `<p>Quelle était la <strong>forme</strong> de cet objet ?</p><div id="shape-options"></div>`,
      choices: ["Valider"],
      button_html: '<button class="jspsych-btn" disabled>%choice%</button>',
      data: { trial_number: trialNumber, question_type: "shape" },
      on_load: function () {
        const btn = document.querySelector(".jspsych-btn");
        const container = document.getElementById("shape-options");
        const opts = [{ val: 'circle', lab: 'Rond' }, { val: 'triangle', lab: 'Triangle' }, { val: 'none', lab: 'Rien vu' }];
        opts.forEach(opt => {
          const w = document.createElement("div");
          w.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;padding:8px;border-radius:8px;border:2px solid transparent;";
          w.innerHTML = `${getShapeSVG(opt.val, 90)}<span style="font-size:0.85em;margin-top:4px;">${opt.lab}</span>`;
          w.onclick = () => {
            Array.from(container.children).forEach(d => { d.style.borderColor = "transparent"; d.style.backgroundColor = "transparent"; });
            w.style.borderColor = "#2ecc71"; w.style.backgroundColor = "rgba(46, 204, 113, 0.2)";
            btn.disabled = false;
            window._selectedShape = opt.val;
          };
          container.appendChild(w);
        });
      },
      on_finish: function (data) {
        data.participant_response_shape = window._selectedShape || null;
        window._selectedShape = null;
      }
    });

    // 4. Confiance forme
    timeline.push({
      type: jsPsychHtmlSliderResponse,
      stimulus: "Indiquez votre niveau de certitude quant à la <strong>forme</strong> choisie :",
      labels: ["Faible certitude", "Totale certitude"],
      min: 0, max: 100, step: 1, slider_start: 50, require_movement: true,
      data: { trial_number: trialNumber, question_type: "confidence_shape" },
      on_finish: function (data) { data.confidence_shape = data.response; }
    });

    // 5. Couleur
    timeline.push({
      type: jsPsychHtmlButtonResponse,
      stimulus: `<p>De quelle <strong>couleur</strong> était cet objet ?</p><div id="color-options"></div>`,
      choices: ["Valider"],
      button_html: '<button class="jspsych-btn" disabled>%choice%</button>',
      data: { trial_number: trialNumber, question_type: "color" },
      on_load: function () {
        const btn = document.querySelector(".jspsych-btn");
        const container = document.getElementById("color-options");
        const cols = [
          { val: 'black', lab: 'Noir', hex: '#000000' },
          { val: 'red', lab: 'Rouge', hex: '#cc0000' },
          { val: 'none', lab: 'Rien vu', hex: null }
        ];
        cols.forEach(c => {
          const w = document.createElement("div");
          w.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;padding:8px;border-radius:8px;border:2px solid transparent;";
          const swatch = c.hex ? `<div style="width:60px;height:60px;border-radius:8px;background:${c.hex};border:1px solid #444;"></div>`
                               : `<div style="width:60px;height:60px;border-radius:8px;background:#888;display:flex;align-items:center;justify-content:center;font-weight:bold;color:#222;">X</div>`;
          w.innerHTML = `${swatch}<span style="font-size:0.85em;margin-top:4px
