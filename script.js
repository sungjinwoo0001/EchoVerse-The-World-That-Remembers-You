/* =========================================================
   ECHOVERSE — script.js
   A narrative game where the world remembers your actions.
   Pure vanilla JS. No dependencies, no backend, no network.
   ========================================================= */

/* ---------- ACTION DEFINITIONS ---------- */

const ACTION_LABELS = {
  talk:        { label: "💬 Talk",       trust:  2,  fear:  0 },
  help:        { label: "🤝 Help",       trust: 15,  fear: -3 },
  steal:       { label: "🗝️ Steal",      trust: -20, fear:  6 },
  protect:     { label: "🛡️ Protect",    trust: 15,  fear: -3 },
  learn:       { label: "📖 Learn",      trust: 10,  fear:  0 },
  investigate: { label: "🔍 Investigate",trust:  0,  fear:  1 },
};

// NPC-facing memory line (first person, what the NPC now remembers)
const MEMORY_PHRASES = {
  talk:        (n) => `${n.name} remembers the stranger stopping to talk.`,
  help:        (n) => `${n.name} remembers the stranger helping without being asked.`,
  steal:       (n) => `${n.name} remembers the stranger stealing from them.`,
  protect:     (n) => `${n.name} remembers the stranger standing between them and danger.`,
  learn:       (n) => `${n.name} remembers sharing knowledge with the stranger.`,
  investigate: (n) => `${n.name} remembers the stranger asking careful questions.`,
};

const GOSSIP_PHRASES = {
  help:  (actor, n) => `${n.name} heard that the stranger helped ${actor.name}.`,
  steal: (actor, n) => `${n.name} heard that the stranger stole from ${actor.name}.`,
};

/* ---------- NPC ROSTER ---------- */

function freshNPCs() {
  return {
    mira:  { key:"mira",  name:"Mira",  role:"Gardener",      icon:"🌿", trust:50, fear:0,
             actions:["talk","help","steal","investigate"], memories:[] },
    rowan: { key:"rowan", name:"Rowan", role:"Blacksmith",    icon:"🔨", trust:50, fear:0,
             actions:["talk","help","steal","protect"],      memories:[] },
    nia:   { key:"nia",   name:"Nia",   role:"Scholar",       icon:"📚", trust:50, fear:0,
             actions:["talk","learn","investigate","help"],  memories:[] },
    kael:  { key:"kael",  name:"Kael",  role:"Village Guard", icon:"🛡️", trust:50, fear:0,
             actions:["talk","protect","investigate","help"],memories:[] },
    elder: { key:"elder", name:"The Elder", role:"Leader of Emberfall", icon:"🕯️", trust:50, fear:0,
             actions:["talk","help","investigate","learn"],  memories:[] },
  };
}

const LORE_SNIPPETS = [
  "The well at the village center is said to have never run dry, even in the driest years.",
  "An old banner near the gate bears a crest no one in Emberfall claims to recognize.",
  "Children whisper that the forest north of the village hums at dusk.",
  "The Elder's cottage has a locked door that has never once been opened in living memory.",
  "Rowan's forge burns with a blue-white flame that no one else can replicate.",
  "Nia keeps a shelf of books written in a script the village scholars can't translate.",
  "Kael patrols the same route every night, as though guarding something unspoken.",
  "Mira's garden grows flowers that bloom out of season, always near the fence line.",
];

/* ---------- GAME STATE ---------- */

let npcs = {};
let state = {
  day: 1,
  actionsCompleted: 0,
  maxActions: 6,
  selectedNpc: null,
  memoryLog: [],
  loreShown: [],
  gameOver: false,
};

/* ---------- DOM SHORTCUTS ---------- */

const $ = (id) => document.getElementById(id);

/* ---------- INIT ---------- */

function initGame() {
  npcs = freshNPCs();
  state = {
    day: 1,
    actionsCompleted: 0,
    maxActions: 6,
    selectedNpc: null,
    memoryLog: [],
    loreShown: [],
    gameOver: false,
  };
  $("endingModal").classList.add("hidden");
  $("loreBox").classList.add("hidden");
  $("loreBox").textContent = "";
  $("dialogueContent").classList.add("hidden");
  $("dialogueEmpty").classList.remove("hidden");
  renderVillage();
  renderMemoryList();
  renderStatus();
}

/* ---------- CLAMP HELPERS ---------- */

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

/* ---------- REPUTATION ---------- */

function averageTrust() {
  const vals = Object.values(npcs).map(n => n.trust);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function reputationLabel() {
  const avg = averageTrust();
  if (avg >= 75) return "Beloved";
  if (avg >= 60) return "Trusted";
  if (avg >= 45) return "Neutral";
  if (avg >= 30) return "Distrusted";
  return "Feared";
}

function worldStateText() {
  const avg = averageTrust();
  const stolenFrom = Object.values(npcs).filter(n =>
    n.memories.some(m => m.startsWith("steal"))
  ).length;

  if (state.actionsCompleted === 0) return "Emberfall is quiet. No one knows you yet.";
  if (avg >= 65) return "Emberfall has warmed to the stranger in its midst.";
  if (avg <= 35) return "Doors close a little faster when you pass by.";
  if (stolenFrom > 0) return "Word of a theft still moves quietly through the village.";
  return "Emberfall watches, uncertain what to make of you.";
}

/* ---------- RENDER: STATUS BAR ---------- */

function renderStatus() {
  $("dayValue").textContent = state.day;
  $("reputationValue").textContent = reputationLabel();
  $("memoryCount").textContent = state.memoryLog.length;
  $("worldState").textContent = worldStateText();
}

/* ---------- RENDER: VILLAGE GRID ---------- */

function renderVillage() {
  const grid = $("villageGrid");
  grid.innerHTML = "";
  Object.values(npcs).forEach(npc => {
    const card = document.createElement("div");
    card.className = "npc-card" + (state.selectedNpc === npc.key ? " selected" : "");
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.innerHTML = `
      <span class="npc-card-icon">${npc.icon}</span>
      <div class="npc-card-name">${npc.name}</div>
      <div class="npc-card-role">${npc.role}</div>
      <div class="npc-card-trust"><div class="npc-card-trust-fill" style="width:${npc.trust}%; background:${trustColor(npc.trust)}"></div></div>
    `;
    card.addEventListener("click", () => selectNPC(npc.key));
    card.addEventListener("keypress", (e) => { if (e.key === "Enter") selectNPC(npc.key); });
    grid.appendChild(card);
  });
}

function trustColor(trust) {
  if (trust >= 65) return "var(--good)";
  if (trust <= 35) return "var(--bad)";
  return "var(--warn)";
}

/* ---------- SELECT NPC ---------- */

function selectNPC(key) {
  if (state.gameOver) return;
  state.selectedNpc = key;
  renderVillage();
  renderDialogue();
}

/* ---------- DIALOGUE ---------- */

function getDialogueLine(npc) {
  if (npc.fear >= 15) {
    return "Leave. I don't want you anywhere near me.";
  }
  if (npc.trust >= 75) {
    return "You came back. I knew I could count on you.";
  }
  if (npc.trust >= 50) {
    return "What do you need?";
  }
  if (npc.trust >= 30) {
    return "I remember what you did. Say what you came to say.";
  }
  return "Leave my sight, stranger.";
}

function renderDialogue() {
  const npc = npcs[state.selectedNpc];
  if (!npc) return;

  $("dialogueEmpty").classList.add("hidden");
  $("dialogueContent").classList.remove("hidden");

  $("npcIcon").textContent = npc.icon;
  $("npcName").textContent = npc.name;
  $("npcRole").textContent = npc.role;
  $("trustFill").style.width = npc.trust + "%";
  $("trustFill").style.background = trustColor(npc.trust);
  $("npcSpeech").textContent = `“${getDialogueLine(npc)}”`;

  const lastMemory = npc.memories[npc.memories.length - 1];
  $("recentEvent").textContent = lastMemory ? `Most recent event: ${lastMemory}` : "";

  renderActionButtons(npc);
}

function renderActionButtons(npc) {
  const wrap = $("actionButtons");
  wrap.innerHTML = "";

  if (state.gameOver) return;

  npc.actions.forEach(actionKey => {
    const def = ACTION_LABELS[actionKey];
    const btn = document.createElement("button");
    btn.className = "action-btn " + actionKey;
    btn.textContent = def.label;
    btn.addEventListener("click", () => performAction(npc.key, actionKey));
    wrap.appendChild(btn);
  });
}

/* ---------- PERFORM ACTION ---------- */

function performAction(npcKey, actionKey) {
  if (state.gameOver) return;

  const npc = npcs[npcKey];
  const def = ACTION_LABELS[actionKey];

  // Update this NPC's relationship values
  npc.trust = clamp(npc.trust + def.trust, 0, 100);
  npc.fear = clamp(npc.fear + def.fear, 0, 100);

  // Create the memory (NPC's perspective)
  const memoryLine = MEMORY_PHRASES[actionKey](npc);
  npc.memories.push(memoryLine);
  logMemory(`${actionKey}:${memoryLine}`, actionKey);

  // World reaction: gossip spreads for strongly meaningful actions
  if (actionKey === "help" || actionKey === "steal") {
    spreadGossip(npc, actionKey);
  }

  state.actionsCompleted += 1;
  state.day += 1;

  renderVillage();
  renderDialogue();
  renderStatus();
  showToast(memoryLine);

  if (state.actionsCompleted >= state.maxActions) {
    setTimeout(triggerEnding, 900);
  }
}

/* ---------- GOSSIP: OTHER NPCS LEARN OF EVENTS ---------- */

function spreadGossip(actorNpc, actionKey) {
  const others = Object.values(npcs).filter(n => n.key !== actorNpc.key);
  others.forEach(n => {
    // Small chance any given NPC has heard the news
    if (Math.random() < 0.55) {
      const delta = actionKey === "help" ? 3 : -6;
      n.trust = clamp(n.trust + delta, 0, 100);
      const line = GOSSIP_PHRASES[actionKey](actorNpc, n);
      n.memories.push(line);
      logMemory(`${actionKey}:${line}`, actionKey === "help" ? "help" : "steal", true);
    }
  });
}

/* ---------- EXPLORE (GLOBAL ACTION) ---------- */

function exploreVillage() {
  if (state.gameOver) return;

  const remaining = LORE_SNIPPETS.filter(l => !state.loreShown.includes(l));
  const pool = remaining.length > 0 ? remaining : LORE_SNIPPETS;
  const snippet = pool[Math.floor(Math.random() * pool.length)];
  state.loreShown.push(snippet);

  const box = $("loreBox");
  box.classList.remove("hidden");
  box.textContent = snippet;

  logMemory(`explore:You explored Emberfall and learned: "${snippet}"`, "explore");

  state.actionsCompleted += 1;
  state.day += 1;
  renderStatus();
  showToast("You explored the village.");

  if (state.actionsCompleted >= state.maxActions) {
    setTimeout(triggerEnding, 900);
  }
}

/* ---------- MEMORY LOG ---------- */

function logMemory(raw, kind, isGossip = false) {
  const text = raw.includes(":") ? raw.split(":").slice(1).join(":") : raw;
  state.memoryLog.push({ day: state.day, text, kind, isGossip });
  renderMemoryList();
}

function renderMemoryList() {
  const list = $("memoryList");
  if (state.memoryLog.length === 0) {
    list.innerHTML = `<p class="memory-empty">Nothing remembered yet. The world is still waiting to know you.</p>`;
    return;
  }
  list.innerHTML = "";
  // newest first
  [...state.memoryLog].reverse().forEach(m => {
    const cls = (m.kind === "help" || m.kind === "protect" || m.kind === "learn") ? "good"
              : (m.kind === "steal") ? "bad" : "";
    const item = document.createElement("div");
    item.className = "memory-item " + cls;
    item.innerHTML = `<span class="mem-day">Day ${m.day}</span>${m.text}`;
    list.appendChild(item);
  });
}

/* ---------- TOAST ---------- */

let toastTimer = null;
function showToast(msg) {
  const toast = $("toast");
  toast.textContent = "🧠 New memory: " + msg;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 3200);
}

/* ---------- ENDINGS ---------- */

function triggerEnding() {
  state.gameOver = true;
  const avg = averageTrust();

  let icon, title, text;

  if (avg >= 62) {
    icon = "🌟";
    title = "The Trusted Stranger";
    text = "Emberfall opened its doors to you. Where you walked, trust followed — a hand offered, a door left unlocked, a name spoken with warmth instead of caution. The village will remember you as the stranger who chose, again and again, to help.";
  } else if (avg <= 38) {
    icon = "🌑";
    title = "The Name People Whisper";
    text = "Emberfall learned to watch you from behind half-closed shutters. What you took, you were not given back — and the village will tell your story for years, not as a warning to strangers, but as a lesson in what trust costs to lose.";
  } else {
    icon = "🌗";
    title = "The Unfinished Echo";
    text = "Emberfall never quite decided what to make of you. You helped where it was easy and took where it was tempting, and the village holds no single memory of you — only a scattering of moments, half-warm, half-wary, waiting to be resolved.";
  }

  $("endingIcon").textContent = icon;
  $("endingTitle").textContent = title;
  $("endingText").textContent = text;

  const memBox = $("endingMemories");
  memBox.innerHTML = "<strong>What Emberfall remembers most:</strong>";
  const highlights = Object.values(npcs)
    .map(n => n.memories[n.memories.length - 1])
    .filter(Boolean)
    .slice(0, 5);
  highlights.forEach(h => {
    const d = document.createElement("div");
    d.textContent = "• " + h;
    memBox.appendChild(d);
  });

  $("endingModal").classList.remove("hidden");
}

/* ---------- AMBIENT EMBERS ---------- */

function spawnEmbers() {
  const field = $("emberField");
  field.innerHTML = "";
  const count = window.innerWidth < 600 ? 12 : 22;
  for (let i = 0; i < count; i++) {
    const e = document.createElement("div");
    e.className = "ember";
    e.style.left = Math.random() * 100 + "vw";
    e.style.animationDuration = (8 + Math.random() * 10) + "s";
    e.style.animationDelay = (Math.random() * 12) + "s";
    e.style.width = e.style.height = (2 + Math.random() * 3) + "px";
    field.appendChild(e);
  }
}

/* ---------- EVENT WIRING ---------- */

$("newWorldBtn").addEventListener("click", initGame);
$("restartBtn").addEventListener("click", initGame);
$("exploreBtn").addEventListener("click", exploreVillage);
$("beginBtn").addEventListener("click", () => {
  $("introModal").classList.add("hidden");
});

/* ---------- START ---------- */

spawnEmbers();
initGame();
