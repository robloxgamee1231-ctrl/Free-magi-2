"use strict";

/* -------------------------------------------------------------------------
   Gate. Only a salt and SHA-256(salt + password) are committed here.
   The password itself is nowhere in this repository. Rotate:
   node -e "const c=require('crypto');const s='<new salt>';const p='<new password>';console.log(c.createHash('sha256').update(s+p).digest('hex'))"
-------------------------------------------------------------------------- */
const GATE = {
  salt: "ndxi-eef4135a7febfcf4",
  hash: "f3ffc1bd2e8b588a393d220f7515efa550069e2acb987ecce2b57ef0411c117f"
};

const MODELS = [
  {
    id: "magi-2", name: "MAGI-2", fire: true, maker: "Sand AI", lane: "open",
    blurb: "114B-param MoE, 6B active per token. Text- and image-to-video at 1080p with synchronized audio, 10-second clips. Apache-2.0 open weights.",
    links: [
      { label: "Open weights", url: "https://huggingface.co/sand-ai/MAGI-2-preview" },
      { label: "Model blog", url: "https://sand.ai/blog/magi-2-preview" }
    ]
  },
  {
    id: "seedance-2-5", name: "Seedance 2.5", fire: true, maker: "ByteDance", lane: "api",
    blurb: "Audio-video joint generation, 4-30 second storytelling with reference control and editing."
  },
  {
    id: "seedance-flash", name: "Seedance Flash", fire: true, maker: "ByteDance", lane: "api",
    blurb: "Flash tier of Seedance 2.5, released Nov 12, 2026. 480p/720p, 4-30 seconds."
  },
  {
    id: "seedance-2-0", name: "Seedance 2.0", maker: "ByteDance", lane: "api",
    blurb: "Previous generation. Hosted as bytedance/seedance-2-0 and seedance-2-0-fast on inference.sh."
  },
  {
    id: "seedance-1-pro", name: "Seedance 1.0 Pro", maker: "ByteDance", lane: "free",
    blurb: "Runs on free credits in your Dropshot bot — the free-b lane, roughly 30 credits per 480p/5s clip."
  },
  {
    id: "kling-v4", name: "Kling V4.0", maker: "Kuaishou", lane: "api",
    blurb: "Native multimodal video model. Up to 30 seconds, 4K, 15 reference assets, 10 keyframes. Flash tier available."
  },
  {
    id: "kling-o3", name: "Kling O3", maker: "Kuaishou", lane: "api",
    blurb: "Multi-modal generation and editing, keyframe guidance, multi-shot sequences with audio at up to 4K. Pro and Standard tiers."
  },
  {
    id: "vidu-q4", name: "Vidu Q4", maker: "Shengshu", lane: "api",
    blurb: "3-16 second clips, 540p to 4K, optional native audio, up to 12 reference images."
  },
  {
    id: "happy-horse-1-1", name: "Happy Horse 1.1", maker: "Alibaba", lane: "api",
    blurb: "1080p text-to-video with synchronized native audio and multilingual lip-sync. Hosted as alibaba/happy-horse/v1.1 on fal."
  },
  {
    id: "minimax-h3", name: "MiniMax H3", maker: "MiniMax", lane: "open",
    blurb: "Omni-modal video model. Went open source in Oct 2026; also runs free on MagicHour in your bot stack."
  },
  {
    id: "wan-3", name: "Wan 3.0", maker: "Alibaba", lane: "api",
    blurb: "2-30 second clips in one pass, 480p to 4K, native audio, every aspect ratio. Wan 2.2 stays free on MagicHour."
  }
];

const LANES = [
  {
    name: "MagicHour bot", via: "magichour_bot.py",
    repo: "https://github.com/robloxgamee1231-ctrl/LcDNSynsi/blob/main/magichour_bot.py",
    models: "LTX-2.3, MiniMax H3, Wan 2.2",
    blurb: "Free-credit lane on MagicHour. Kling, Veo and Seedance are paid there and excluded."
  },
  {
    name: "Dropshot bot", via: "dropshot_bot.py",
    repo: "https://github.com/robloxgamee1231-ctrl/LcDNSynsi/blob/main/dropshot_bot.py",
    models: "Grok Imagine Video, Seedance 1.0 Pro",
    blurb: "Free-model rotation, roughly 26-30 credits per 480p/5s clip."
  },
  {
    name: "Yolly API", via: "yolly_api.py",
    repo: "https://github.com/robloxgamee1231-ctrl/LcDNSynsi/blob/main/yolly_api.py",
    models: "Grok Imagine",
    blurb: "Temp-email signup, free generation endpoint."
  }
];

const LANE_LABEL = { open: "Open Weights", free: "Free Lane", api: "API" };

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

const isOpen = () => sessionStorage.getItem("ndxi-session") === "open";

async function tryEnter() {
  const input = document.getElementById("pw");
  const msg = document.getElementById("gate-msg");
  if (!input.value) { msg.textContent = "Type the key."; return; }
  const digest = await sha256(GATE.salt + input.value);
  if (digest === GATE.hash) {
    sessionStorage.setItem("ndxi-session", "open");
    input.value = "";
    msg.textContent = "";
    openApp();
  } else {
    msg.textContent = "Wrong key.";
    input.value = "";
  }
}

function openApp() {
  document.getElementById("gate").hidden = true;
  document.getElementById("app").hidden = false;
  renderSelect();
  renderGrid();
  renderLanes();
}

function closeApp() {
  sessionStorage.removeItem("ndxi-session");
  document.getElementById("app").hidden = true;
  document.getElementById("gate").hidden = false;
  document.getElementById("pw").focus();
}

function renderSelect() {
  const pick = document.getElementById("model-pick");
  pick.innerHTML = "";
  for (const m of MODELS) {
    const opt = el("option", null, (m.fire ? "\u{1F525} " : "") + m.name);
    opt.value = m.id;
    pick.append(opt);
  }
}

function renderGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  for (const m of MODELS) {
    const card = el("article", "card");
    const head = el("div", "card-head");
    head.append(el("h3", "card-name", m.name));
    if (m.fire) head.append(el("span", "fire", "\u{1F525}"));
    head.append(el("span", "pill pill-" + m.lane, LANE_LABEL[m.lane]));
    card.append(head);
    card.append(el("p", "maker", m.maker));
    card.append(el("p", "blurb", m.blurb));
    if (m.links) {
      const links = el("p", "card-links");
      for (const l of m.links) {
        const a = el("a", null, l.label);
        a.href = l.url;
        a.target = "_blank";
        a.rel = "noopener";
        links.append(a);
      }
      card.append(links);
    }
    grid.append(card);
  }
}

function renderLanes() {
  const grid = document.getElementById("lane-grid");
  grid.innerHTML = "";
  for (const l of LANES) {
    const card = el("article", "card");
    card.append(el("h3", "card-name", l.name));
    card.append(el("p", "maker", l.models));
    card.append(el("p", "blurb", l.blurb));
    const links = el("p", "card-links");
    const a = el("a", null, l.via);
    a.href = l.repo;
    a.target = "_blank";
    a.rel = "noopener";
    links.append(a);
    card.append(links);
    grid.append(card);
  }
}

function log(line) {
  const box = document.getElementById("log");
  box.textContent += (box.textContent ? "\n" : "") + line;
  box.scrollTop = box.scrollHeight;
}

function run() {
  const promptEl = document.getElementById("prompt");
  const prompt = promptEl.value.trim();
  const model = MODELS.find(m => m.id === document.getElementById("model-pick").value);
  const t = new Date().toLocaleTimeString();
  if (!prompt) { log("[" + t + "] [!] Write a prompt first."); return; }
  const shown = prompt.length > 72 ? prompt.slice(0, 72) + "\u2026" : prompt;
  log("[" + t + "] " + model.name + " \u2190 \"" + shown + "\"");
  if (model.lane === "open") {
    log("[" + t + "] Open weights route — self-host from the linked HuggingFace repo (Apache-2.0; MAGI-2 needs Hopper GPUs, MiniMax H3 self-hostable). Hosted APIs for this model are paid.");
    log("[" + t + "] No free hosted endpoint wired for " + model.name + ". Nothing sent, nothing faked.");
  } else if (model.lane === "free") {
    log("[" + t + "] Free lane — run " + model.name + " through the Dropshot bot in LcDNSynsi (link in Free Lanes). That is where it is actually free.");
  } else {
    log("[" + t + "] " + model.name + " ships through paid APIs only — no free hosted endpoint exists for it. Listed, not wired. Nothing faked.");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  if (isOpen()) {
    openApp();
  } else {
    document.getElementById("pw").focus();
  }
  document.getElementById("enter").addEventListener("click", tryEnter);
  document.getElementById("pw").addEventListener("keydown", e => { if (e.key === "Enter") tryEnter(); });
  document.getElementById("pw").addEventListener("input", () => { document.getElementById("gate-msg").textContent = ""; });
  document.getElementById("logout").addEventListener("click", closeApp);
  document.getElementById("run").addEventListener("click", run);
});
