/* ============================
   Tiny helpers
============================ */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const clamp = (v,a,b) => Math.max(a, Math.min(b,v));

/* ============================
   Gate -> App
============================ */
const gate = $("#gate");
const app = $("#app");
$("#enterBtn").addEventListener("click", () => {
  gate.classList.add("is-leaving");
  setTimeout(() => {
    gate.style.display = "none";
    app.classList.add("is-on");
    app.setAttribute("aria-hidden","false");
  }, 430);
});

/* ============================
   Modals
============================ */
const modals = {
  gallery: $("#galleryModal"),
  friends: $("#friendsModal"),
  links: $("#linksModal"),
  viewer: $("#viewer"),
  fcard: $("#friendCard")
};

function openModal(key){
  const m = modals[key];
  if(!m) return;
  m.classList.add("is-on");
  m.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
}
function closeModal(key){
  const m = modals[key];
  if(!m) return;
  m.classList.remove("is-on");
  m.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}

$("#galleryBtn").addEventListener("click", () => openModal("gallery"));
$("#friendsBtn").addEventListener("click", () => openModal("friends"));
$("#linksBtn").addEventListener("click", () => openModal("links"));

document.addEventListener("click", (e) => {
  const t = e.target;
  const k = t?.getAttribute?.("data-close");
  if(!k) return;
  closeModal(k);
});

document.addEventListener("keydown", (e) => {
  if(e.key !== "Escape") return;
  Object.keys(modals).forEach(k => {
    if(modals[k].classList.contains("is-on")) closeModal(k);
  });
});

/* ============================
   Clock (visitor local device timezone)
   - True city/country via IP requires a server/API.
============================ */
const clockTime = $("#clockTime");
const clockZone = $("#clockZone");
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "local";

function prettyZoneLabel(z){
  const parts = (z || "").split("/");
  const region = parts[0] || "Region";
  const city = (parts[parts.length - 1] || "City").replaceAll("_"," ");
  return `${city} • ${region}`;
}
clockZone.textContent = `${prettyZoneLabel(tz)} (${tz})`;

function tick(){
  const d = new Date();
  const fmt = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit", minute:"2-digit", second:"2-digit"
  });
  clockTime.textContent = fmt.format(d);
}
tick();
setInterval(tick, 250);

/* ============================
   Gallery -> Fullscreen cinematic viewer
   - click image to open viewer
   - parallax tilt on mouse
============================ */
const viewer = $("#viewer");
const viewerFrame = $("#viewerFrame");
const viewerImg = $("#viewerImg");

$("#galleryGrid").addEventListener("click", (e) => {
  const btn = e.target.closest(".shot");
  if(!btn) return;
  const url = btn.getAttribute("data-full");
  if(!url) return;

  viewerImg.src = url;
  openModal("viewer");
  // reset tilt
  viewerFrame.style.transform = "translate(-50%,-50%) rotateX(0deg) rotateY(0deg)";
});

function setTiltFromEvent(ev){
  const rect = viewerFrame.getBoundingClientRect();
  const x = (ev.clientX - rect.left) / rect.width;   // 0..1
  const y = (ev.clientY - rect.top) / rect.height;   // 0..1
  const rx = clamp((0.5 - y) * 10, -10, 10);
  const ry = clamp((x - 0.5) * 12, -12, 12);
  viewerFrame.style.transform = `translate(-50%,-50%) rotateX(${rx}deg) rotateY(${ry}deg)`;
}
viewer.addEventListener("mousemove", (e) => {
  if(!viewer.classList.contains("is-on")) return;
  setTiltFromEvent(e);
});
viewer.addEventListener("mouseleave", () => {
  viewerFrame.style.transform = "translate(-50%,-50%) rotateX(0deg) rotateY(0deg)";
});

/* ============================
   Friends list + mini profile card
============================ */
const friendsList = $("#friendsList");
const friendImg = "https://xatimg.com/image/SydxCIOrK47N.jpg";

const namesPool = [
  "Nova","Cipher","Vanta","Kairo","Lyra","Astra","Nyx","Orion",
  "Sable","Zenith","Echo","Juno","Riven","Solace","Fable","Rune"
];
const statusPool = ["online","away","busy","idle"];

function makeFriends(count=10){
  const used = new Set();
  const out = [];
  while(out.length < count){
    const n = namesPool[Math.floor(Math.random()*namesPool.length)];
    if(used.has(n)) continue;
    used.add(n);
    out.push({
      name: n,
      meta: statusPool[Math.floor(Math.random()*statusPool.length)],
      sync: 60 + Math.floor(Math.random()*41),
      signal: 50 + Math.floor(Math.random()*51),
      heat: 40 + Math.floor(Math.random()*61)
    });
  }
  return out;
}

let friendsData = makeFriends(10);

function renderFriends(){
  friendsData = makeFriends(10);
  friendsList.innerHTML = "";
  for(const f of friendsData){
    const li = document.createElement("li");
    li.className = "friend";
    li.dataset.name = f.name;
    li.innerHTML = `
      <img src="${friendImg}" alt="${f.name}">
      <div>
        <div class="n">${f.name}</div>
        <div class="m">${f.meta}</div>
      </div>
    `;
    friendsList.appendChild(li);
  }
}
renderFriends();
$("#friendsBtn").addEventListener("click", renderFriends);

const fcardImg = $("#fcardImg");
const fcardName = $("#fcardName");
const fcardMeta = $("#fcardMeta");
const pulseBtn = $("#pulseBtn");
const pulseMsg = $("#pulseMsg");
const statSync = $("#statSync");
const statSignal = $("#statSignal");
const statHeat = $("#statHeat");

let activeFriend = null;

friendsList.addEventListener("click", (e) => {
  const item = e.target.closest(".friend");
  if(!item) return;
  const name = item.dataset.name;
  const f = friendsData.find(x => x.name === name);
  if(!f) return;

  activeFriend = f;
  fcardImg.src = friendImg;
  fcardName.textContent = f.name;
  fcardMeta.textContent = `${f.meta} • synced`;
  statSync.textContent = `${f.sync}%`;
  statSignal.textContent = `${f.signal}%`;
  statHeat.textContent = `${f.heat}%`;
  pulseMsg.textContent = "";
  openModal("fcard");
});

pulseBtn.addEventListener("click", () => {
  if(!activeFriend) return;
  const lines = [
    `Pulse delivered to ${activeFriend.name}.`,
    `Signal locked: ${activeFriend.name} received it.`,
    `Connection warmed: ${activeFriend.name} is reacting.`,
    `Transmission successful.`
  ];
  pulseMsg.textContent = lines[Math.floor(Math.random()*lines.length)];
});

/* ============================
   Player minimize
============================ */
const player = $("#player");
$("#playerMin").addEventListener("click", () => {
  player.classList.toggle("is-min");
});

/* ============================
   Custom YouTube controls (IFrame API)
   Video: gaCildGvRvg
============================ */
let yt;
let ready = false;
let updatingSeek = false;

const btnPlay = $("#btnPlay");
const btnMute = $("#btnMute");
const seek = $("#seek");
const vol = $("#vol");
const tCur = $("#tCur");
const tDur = $("#tDur");

function fmtTime(s){
  s = Math.max(0, Math.floor(s || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2,"0")}`;
}

function loadYouTubeAPI(){
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}
loadYouTubeAPI();

window.onYouTubeIframeAPIReady = () => {
  yt = new YT.Player("ytPlayer", {
    height: "100%",
    width: "100%",
    videoId: "gaCildGvRvg",
    playerVars: {
      rel: 0,
      modestbranding: 1,
      playsinline: 1
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerState
    }
  });
};

function onPlayerReady(){
  ready = true;
  try{
    yt.setVolume(Number(vol.value));
  }catch{}
  updateUI();
  setInterval(updateUI, 250);
}
function onPlayerState(){
  updateUI();
}

btnPlay.addEventListener("click", () => {
  if(!ready) return;
  const st = yt.getPlayerState();
  if(st === YT.PlayerState.PLAYING) yt.pauseVideo();
  else yt.playVideo();
});

btnMute.addEventListener("click", () => {
  if(!ready) return;
  if(yt.isMuted()) yt.unMute();
  else yt.mute();
  updateUI();
});

vol.addEventListener("input", () => {
  if(!ready) return;
  yt.setVolume(Number(vol.value));
});

seek.addEventListener("input", () => {
  if(!ready) return;
  updatingSeek = true;
  const dur = yt.getDuration() || 0;
  const target = (Number(seek.value) / 1000) * dur;
  tCur.textContent = fmtTime(target);
});
seek.addEventListener("change", () => {
  if(!ready) return;
  const dur = yt.getDuration() || 0;
  const target = (Number(seek.value) / 1000) * dur;
  yt.seekTo(target, true);
  updatingSeek = false;
});

function updateUI(){
  if(!ready) return;

  const dur = yt.getDuration() || 0;
  const cur = yt.getCurrentTime() || 0;

  tDur.textContent = fmtTime(dur);
  if(!updatingSeek && dur > 0){
    seek.value = String(Math.floor((cur / dur) * 1000));
  }
  tCur.textContent = fmtTime(cur);

  const st = yt.getPlayerState();
  btnPlay.textContent = (st === YT.PlayerState.PLAYING) ? "pause" : "play";
  btnMute.textContent = yt.isMuted() ? "unmute" : "mute";
}

/* ============================
   Flame sparkles (canvas embers)
============================ */
const canvas = $("#flameCanvas");
const ctx = canvas.getContext("2d", { alpha:true });

let W=0, H=0, DPR=Math.max(1, Math.min(2, window.devicePixelRatio || 1));
function resize(){
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener("resize", resize);
resize();

const parts = [];
const MAX = 140;

function spawn(x=Math.random()*W, y=H+40){
  const b = Math.random();
  parts.push({
    x, y,
    vx: (Math.random()-0.5)*(0.35 + b*0.8),
    vy: -(0.9 + b*2.6),
    r: 0.7 + b*2.6,
    life: 0,
    ttl: 90 + Math.random()*180,
    a: 0.7 + Math.random()*0.2,
    hue: 16 + Math.random()*26,
    flick: 0.6 + Math.random()*0.8
  });
}
function step(){
  // trail fade
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0,0,W,H);

  while(parts.length < MAX) spawn(Math.random()*W, H + Math.random()*90);
  if(Math.random() < 0.14) spawn(Math.random()*W, H+40);

  ctx.globalCompositeOperation = "lighter";

  for(let i=parts.length-1;i>=0;i--){
    const p = parts[i];
    p.life++;

    const t = p.life * 0.015;
    p.vx += Math.sin((p.x+p.life)*0.01)*0.010;
    p.vx *= 0.994;

    p.x += p.vx * 3.3;
    p.y += p.vy * 2.1;

    const k = 1 - (p.life / p.ttl);
    const flick = 0.55 + 0.45 * Math.sin(t*9 + p.flick*10);
    const alpha = clamp(p.a * k * flick, 0, 0.9);
    const rr = p.r * (0.6 + k);

    const grad = ctx.createRadialGradient(p.x,p.y,0, p.x,p.y, rr*10);
    grad.addColorStop(0, `hsla(${p.hue},95%,65%,${alpha})`);
    grad.addColorStop(0.35, `hsla(${p.hue+10},95%,55%,${alpha*0.55})`);
    grad.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x,p.y, rr*8, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = `hsla(${p.hue+10},98%,72%,${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x,p.y, rr*0.9, 0, Math.PI*2);
    ctx.fill();

    if(p.life > p.ttl || p.y < -140 || p.x < -200 || p.x > W+200){
      parts.splice(i,1);
    }
  }

  requestAnimationFrame(step);
}
ctx.clearRect(0,0,W,H);
step();
