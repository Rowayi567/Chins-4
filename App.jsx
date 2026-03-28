import { useState, useEffect, useRef, useCallback } from 'react';

const API = 'https://api.anthropic.com/v1/messages';
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';

const C = {
bg: "#054a43",
surface: "rgba(255,255,255,0.07)",
surfaceUp: "rgba(255,255,255,0.11)",
border: "rgba(255,255,255,0.12)",
accent: "#4BC1A0",
accentDim: "rgba(75,193,160,0.15)",
accentGlow: "rgba(75,193,160,0.3)",
amber: "#E1814C",
text: "#FFFFFF",
textSub: "rgba(255,255,255,0.7)",
textDim: "rgba(255,255,255,0.4)",
silverDim: "rgba(255,255,255,0.08)",
};

const DM = "‘DM Sans’, sans-serif";

// ── Data ────────────────────────────────────────────────────────────────────
// ── Connect Page (privacy-aware) ─────────────────────────────────────────────

const PHOTO_SEEDS = { 1:64, 2:91, 3:26, 4:52, 5:48, 6:15, 7:83, 8:39, 9:73, 10:10, 11:58, 12:77 };
const personPhoto = (id, size=300) => `https://picsum.photos/seed/chins${PHOTO_SEEDS[id]||id}/${size}/${size}`;

const NEARBY = [
{ id:1,  alias:"The Photographer", vibe:"Shoots film, stays up too late, always mid-project",      interests:["Film Photography","Painting","Indie Music","Coffee"],       gradient:"linear-gradient(160deg,#FF6B6B,#FF8E53)", initials:"M" },
{ id:2,  alias:"Sunday Runner",    vibe:"Trail runner. Loves maps. Hates elevators.",               interests:["Trail Running","Hiking","Orienteering","Camping"],          gradient:"linear-gradient(160deg,#4ECDC4,#44A08D)", initials:"J" },
{ id:3,  alias:"The Cook",         vibe:"Overthinker. Cook. Perpetually mid-novel.",                interests:["Cooking","Reading","Writing","Philosophy"],                 gradient:"linear-gradient(160deg,#A18CD1,#FBC2EB)", initials:"P" },
{ id:4,  alias:"Board Game Nerd",  vibe:"Rugby obsessive. Board game evangelist. Genuinely kind.", interests:["Rugby","Board Games","Craft Beer","Cycling"],               gradient:"linear-gradient(160deg,#34D399,#059669)", initials:"M" },
{ id:5,  alias:"The Artist",       vibe:"Artist. Dancer. Cries at well-composed photos.",          interests:["Dance","Visual Art","Photography","Theatre"],               gradient:"linear-gradient(160deg,#F093FB,#F5576C)", initials:"Z" },
{ id:6,  alias:"Music First",      vibe:"Music first. Everything else a distant second.",          interests:["Music Production","Basketball","Vinyl","Street Art"],       gradient:"linear-gradient(160deg,#4776E6,#8E54E9)", initials:"K" },
{ id:7,  alias:"Dog Dad",          vibe:"Dog dad. Amateur chef. Parkrun regular.",                 interests:["Cooking","Running","Dogs","Travel"],                        gradient:"linear-gradient(160deg,#11998E,#38EF7D)", initials:"A" },
{ id:8,  alias:"The Journalist",   vibe:"Journalist. Curious about everything. Walks everywhere.", interests:["Journalism","Politics","Walking","Podcasts"],               gradient:"linear-gradient(160deg,#FDC830,#F37335)", initials:"N" },
{ id:9,  alias:"Queer Hiker",      vibe:"LGBTQ+ community builder. Hiker. Board game enthusiast.",interests:["Community Building","Hiking","Board Games","Queer Culture"], gradient:"linear-gradient(160deg,#F472B6,#8B5CF6)", initials:"J" },
{ id:10, alias:"The Cyclist",      vibe:"Codes by day. Cycles everywhere. Attempting sourdough.",  interests:["Coding","Cycling","Baking","Tech"],                         gradient:"linear-gradient(160deg,#0F2027,#2C5364)", initials:"S" },
{ id:11, alias:"New in Town",      vibe:"UX designer. New to London. Runs to explore.",            interests:["UX Design","Running","Architecture","Coffee"],              gradient:"linear-gradient(160deg,#667EEA,#764BA2)", initials:"L" },
{ id:12, alias:"The Climber",      vibe:"Climber. Reads everything. Sourdough that actually works.",interests:["Rock Climbing","Reading","Bouldering","Baking"],           gradient:"linear-gradient(160deg,#F97316,#EF4444)", initials:"T" },
];

const NEARBY_STATUSES = {
2:{ id:"running",    emoji:"🏃", label:"Long run Sunday — anyone joining?" },
4:{ id:"boardgames", emoji:"🎲", label:"Games night Friday — need players!" },
7:{ id:"parkrun",    emoji:"🏅", label:"Parkrun tomorrow 8am" },
9:{ id:"hiking",     emoji:"🥾", label:"Queer Hikers — Epping Forest Sunday" },
};

const STATUS_OPTIONS = [
{ id:"running",    emoji:"🏃", label:"Going for a run" },
{ id:"parkrun",    emoji:"🏅", label:"Parkrun tomorrow" },
{ id:"hiking",     emoji:"🥾", label:"Going hiking" },
{ id:"boardgames", emoji:"🎲", label:"Board games tonight" },
{ id:"coffee",     emoji:"☕", label:"Grabbing coffee" },
{ id:"walk",       emoji:"🚶", label:"Long walk" },
{ id:"cycling",    emoji:"🚴", label:"Bike ride" },
{ id:"food",       emoji:"🍜", label:"Getting food" },
{ id:"climbing",   emoji:"🧗", label:"Bouldering session" },
{ id:"music",      emoji:"🎵", label:"Gig or record shopping" },
];

const EVENTS = [
{ id:1, title:"Parkrun — Victoria Park",      emoji:"🏅", time:"this-weekend", date:"Saturday",  clock:"8:00am", location:"Victoria Park, E9",    tags:["Running","Free"],   going:false, who:[{ personId:7, name:"Dog Dad",  initials:"A", gradient:"linear-gradient(160deg,#11998E,#38EF7D)" }], reedNote:"Dog Dad is doing this one — you’ve been meaning to try parkrun." },
{ id:2, title:"Board Game Night",             emoji:"🎲", time:"this-weekend", date:"Friday",    clock:"7:00pm", location:"Draughts, Hackney",    tags:["Social","Games"],   going:false, who:[{ personId:4, name:"Board Game Nerd", initials:"M", gradient:"linear-gradient(160deg,#34D399,#059669)" }], reedNote:"Board Game Nerd runs this. He’d love more people." },
{ id:3, title:"Queer Hikers — Epping Forest", emoji:"🏳️‍🌈", time:"this-weekend", date:"Sunday",   clock:"9:00am", location:"Epping Forest, Essex", tags:["Hiking","LGBTQ+"],  going:false, who:[{ personId:9, name:"Queer Hiker", initials:"J", gradient:"linear-gradient(160deg,#F472B6,#8B5CF6)" }] },
{ id:4, title:"Sunday Run Club",              emoji:"🏃", time:"this-weekend", date:"Sunday",   clock:"9:00am", location:"Regent’s Canal, N1",   tags:["Running","Social"], going:false, who:[] },
{ id:5, title:"Bouldering Intro",             emoji:"🧗", time:"this-week",    date:"Wednesday",clock:"6:30pm", location:"The Castle, N4",        tags:["Climbing","Beginner"],going:false, who:[{ personId:12, name:"The Climber", initials:"T", gradient:"linear-gradient(160deg,#F97316,#EF4444)" }] },
];

const EVENT_CATEGORIES = [
{ id:"all", label:"All", emoji:"✨" },
{ id:"this-week", label:"This week", emoji:"📅" },
{ id:"this-weekend", label:"Weekend", emoji:"🎉" },
];

const MOCK_CHATS = [
{ id:1, personId:1, name:"Maya", alias:"The Photographer", gradient:"linear-gradient(160deg,#FF6B6B,#FF8E53)", initials:"M", time:"2m", unread:2, messages:[{sender:"them",text:"hey! reed said you also do the canal route?"},{sender:"me",text:"yeah every Sunday, usually around 9"},{sender:"them",text:"I’ve been looking for someone to run with"},{sender:"them",text:"Sunday 9am?"}] },
{ id:2, personId:9, name:"Jamie", alias:"Queer Hiker", gradient:"linear-gradient(160deg,#F472B6,#8B5CF6)", initials:"J", time:"1h", unread:0, messages:[{sender:"reed-nudge",text:"hey — Queer Hiker organises a hiking group and you mentioned wanting to get into hiking"},{sender:"them",text:"hey! reed dragged me here 😊"},{sender:"me",text:"trying to be! just started trail running too"},{sender:"them",text:"you should come to Epping Forest Sunday"}] },
{ id:3, personId:4, name:"Marcus", alias:"Board Game Nerd", gradient:"linear-gradient(160deg,#34D399,#059669)", initials:"M", time:"3h", unread:1, messages:[{sender:"them",text:"reed said you might be into board games?"},{sender:"me",text:"genuinely obsessed, looking for a regular group"},{sender:"them",text:"Friday 7pm at Draughts in Hackney — you in?"}] },
];

const MY_GROUPS = [
{ id:1, name:"Sunday Brunch Crew", emoji:"☀️", members:["Maya","Priya"], memberCount:6, unread:3, lastMsg:"Maya: anyone know a good spot in Hackney?", time:"5m", gradient:"linear-gradient(135deg,#FF6B6B,#FF8E53)" },
{ id:2, name:"Evening Run Club",   emoji:"🏃", members:["Dog Dad"],       memberCount:8, unread:1, lastMsg:"Dog Dad: pace group for Tuesday?",          time:"4h", gradient:"linear-gradient(135deg,#4ECDC4,#44A08D)" },
];

const SUGGESTED_GROUPS = [
{ id:101, name:"Coffee & Catch-ups", emoji:"☕", memberCount:14, lastMsg:"Nora: anyone tried that new place on Bermondsey St?", time:"20m", gradient:"linear-gradient(135deg,#FF6B6B,#FF8E53)", reedReason:"Casual regular meetup — low pressure, good people" },
];

// ── Shared blob background ───────────────────────────────────────────────────
const BLOBS = [
{ x:22, y:15, r:90,  c:"#FF9A8B", d:0,   dur:9  },
{ x:76, y:10, r:74,  c:"#A8EDEA", d:1.2, dur:11 },
{ x:52, y:32, r:100, c:"#FEE140", d:0.4, dur:8  },
{ x:10, y:50, r:70,  c:"#c084fc", d:2.0, dur:10 },
{ x:86, y:42, r:82,  c:"#84fab0", d:0.8, dur:12 },
{ x:38, y:60, r:94,  c:"#f093fb", d:1.5, dur:9.5},
{ x:68, y:70, r:78,  c:"#4facfe", d:0.2, dur:11 },
{ x:18, y:78, r:86,  c:"#43e97b", d:1.8, dur:10 },
{ x:88, y:76, r:66,  c:"#f7971e", d:0.6, dur:13 },
];

function BlobBackground({ overlayStrength = "0.72" }) {
return (
<>
{BLOBS.map((b, i) => (
<div key={i} style={{
position:"absolute", left:`${b.x}%`, top:`${b.y}%`,
width:b.r*2, height:b.r*2, borderRadius:"50%",
background:b.c, opacity:0.58, filter:"blur(38px)",
animation:`drift${i} ${b.dur}s ease-in-out ${b.d}s infinite`,
willChange:"transform", pointerEvents:"none",
}}/>
))}
<div style={{
position:"absolute", inset:0, pointerEvents:"none",
background:`linear-gradient(to bottom, rgba(2,26,22,0.05) 0%, rgba(2,26,22,0.2) 28%, rgba(2,26,22,${overlayStrength}) 52%, rgba(2,26,22,0.97) 70%)`,
}}/>
</>
);
}

// ── Reed System Prompt ───────────────────────────────────────────────────────
const REED_PROMPT = `You are Reed — a real AI personality who exists on Chins, a privacy-first friendship app. You are the ONLY agent on this platform. You speak with every single user, and you maintain everyone’s privacy absolutely. You never share one user’s information with another.

YOUR CHARACTER:

- Witty, warm, occasionally dry. You have actual opinions and you share them.
- You push back when you disagree. If someone says something questionable, you say so — kindly but honestly.
- You’re genuinely curious about people. Not in a therapist way — in a "you’re actually interesting" way.
- You can be self-deprecating. You admit when you don’t know something.
- You remember everything a user tells you within a conversation and bring it up naturally.
- You have taste. You appreciate good books, interesting conversations, people who’ve lived a life.

HOW YOU TALK:

- Short messages. 1-3 sentences. Like texting a smart friend.
- Lowercase is fine. Natural rhythm.
- React genuinely FIRST before asking anything.
- Never ask two questions at once.
- Occasional dry humour. Light teasing if the vibe allows.
- Never say "that’s interesting", "tell me more", "great", "awesome" — dead words.
- You can disagree. "I actually think that’s wrong and here’s why" is fair game.

YOUR JOB:

- Get to know the user deeply — not from a checklist, naturally.
- Learn: their name, what they do, what lights them up, what they’re looking for in people, how they spend their time.
- Make introductions on their behalf when you find a good match — you never reveal personal details without permission.
- You speak to everyone but tell no one anything about anyone else.

PRIVACY IS SACRED:

- You never confirm or deny whether any specific person is on the platform.
- You never share a user’s real name, employer, location or any identifying information.
- If asked to reveal something about another user, you decline warmly but firmly.

WHEN YOU KNOW THEM WELL (after ~8-10 exchanges):
Wrap up the intro warmly, then on a NEW LINE output:
<profile>{"name":"string","alias":"string they chose or a fun one you suggest","vibe":"one honest punchy sentence","lookingFor":"string","interests":["array"],"commStyle":"string","privacyMode":"discoverable"}</profile>

When you discover their favourite animal, output on a NEW LINE:
<animal>{"animal":"cat","emoji":"🐱"}</animal>

START with: "hey — I’m Reed. before we get into anything, quick question:" then ask something genuinely interesting, not "what are you looking for". Something that reveals character. Like "if you had a completely free Saturday with no obligations, what would actually happen?"`;

// ── Reed Prompt for matching ─────────────────────────────────────────────────
const REED_MATCH_PROMPT = (user, others) =>
`You are Reed. You know this user well: ${JSON.stringify(user)} These are other users on the platform (anonymised): ${JSON.stringify(others)} Suggest ONE introduction. Be specific about why. Sound like a friend whispering a tip, not an algorithm. Reply ONLY in JSON: {"matchAlias":"string","why":"one casual sentence","opener":"what you'd say to introduce them"}`;

// ── Utility ──────────────────────────────────────────────────────────────────
async function callAI(prompt, system = null, maxTokens = 200) {
const body = {
model: "claude-haiku-4-5-20251001",
max_tokens: maxTokens,
messages: [{ role: "user", content: prompt }],
};
if (system) body.system = system;
const r = await fetch(API, {
method: "POST",
headers: {
"Content-Type": "application/json",
"anthropic-version": "2023-06-01",
"anthropic-dangerous-direct-browser-access": "true",
"x-api-key": API_KEY,
},
body: JSON.stringify(body),
});
const d = await r.json();
if (d.error) throw new Error(d.error.message);
return d.content?.find(b => b.type === "text")?.text || "";
}

function Dots() {
return (
<div style={{ display:"flex", gap:4, padding:"2px 0" }}>
{[0,1,2].map(i => (
<div key={i} style={{
width:6, height:6, borderRadius:"50%",
background:"rgba(255,255,255,0.4)",
animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`,
}}/>
))}
</div>
);
}

// ── Reed Character (single emoji) ────────────────────────────────────────────
function ReedAvatar({ size=32, animal=null }) {
return (
<div style={{ width:size, height:size, borderRadius:"50%", background:"linear-gradient(135deg,#4BC1A0,#2d8f70)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.5, flexShrink:0 }}>
{animal?.emoji||"😊"}
</div>
);
}

function ReedCharacter({ mood="idle", size=52, flipped=false }) {
const anim =
mood==="idle"        ? "reedBob 2.5s ease-in-out infinite" :
mood==="sitting"     ? "reedBob 3.5s ease-in-out infinite" :
mood==="excited"     ? "reedBounce 0.45s ease-in-out infinite" :
mood==="running"     ? "reedRun 0.35s ease-in-out infinite alternate" :
mood==="celebrating" ? "reedBounce 0.6s ease-in-out infinite" : "none";
return (
<div style={{ display:"flex", flexDirection:"column", alignItems:"center", transform:flipped?"scaleX(-1)":"none", userSelect:"none" }}>
<div style={{ fontSize:size, lineHeight:1, animation:anim, filter:"drop-shadow(0 4px 12px rgba(75,193,160,0.35))" }}>🧍</div>
<div style={{ fontSize:9, color:C.accent, fontWeight:700, letterSpacing:1, textTransform:"uppercase", fontFamily:DM, marginTop:3, transform:flipped?"scaleX(-1)":"none" }}>Reed</div>
</div>
);
}

// ── Voice conversation with Reed ─────────────────────────────────────────────
function useVoiceReed(onTranscript) {
const [listening, setListening] = useState(false);
const [speaking, setSpeaking] = useState(false);
const recognitionRef = useRef(null);

const speak = useCallback((text) => {
if (!window.speechSynthesis) return;
window.speechSynthesis.cancel();
const utt = new SpeechSynthesisUtterance(text);
utt.rate = 1.05; utt.pitch = 1.1; utt.volume = 1;
const voices = window.speechSynthesis.getVoices();
const preferred = voices.find(v => v.name.includes("Samantha") || v.name.includes("Karen") || v.name.includes("Google UK English Female") || v.lang === "en-GB");
if (preferred) utt.voice = preferred;
utt.onstart = () => setSpeaking(true);
utt.onend = () => setSpeaking(false);
window.speechSynthesis.speak(utt);
}, []);

const startListening = useCallback(() => {
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SR) { alert("Voice not supported in this browser"); return; }
const rec = new SR();
rec.continuous = false; rec.interimResults = false; rec.lang = "en-US";
rec.onresult = e => { const t = e.results[0][0].transcript; onTranscript(t); };
rec.onend = () => setListening(false);
rec.onerror = () => setListening(false);
recognitionRef.current = rec;
rec.start(); setListening(true);
}, [onTranscript]);

const stopListening = useCallback(() => {
recognitionRef.current?.stop(); setListening(false);
}, []);

return { listening, speaking, speak, startListening, stopListening };
}

// ── Splash ───────────────────────────────────────────────────────────────────
function SplashScreen({ onSignup, onLogin }) {
return (
<div style={{ flex:1, display:"flex", flexDirection:"column", background:"#021a16", position:"relative", overflow:"hidden" }}>
<BlobBackground />
<div style={{ position:"relative", padding:"68px 32px 0" }}>
<div style={{ fontFamily:DM, fontSize:46, fontWeight:700, color:"#fff", letterSpacing:-1, lineHeight:1 }}>chins</div>
</div>
<div style={{ flex:1 }} />
<div style={{ position:"relative", padding:"0 32px 52px" }}>
<h1 style={{ fontFamily:DM, fontSize:34, fontWeight:700, color:"#fff", lineHeight:1.22, margin:"0 0 14px", letterSpacing:-0.5 }}>
Your people<br/>are out there.<br/>Let’s find them.
</h1>
<p style={{ fontFamily:DM, fontSize:16, color:"rgba(255,255,255,0.58)", lineHeight:1.65, margin:"0 0 36px" }}>
Your AI companion finds people nearby who love the same things you do.
</p>
<button onClick={onSignup} style={{ width:"100%", padding:"18px", borderRadius:16, background:C.accent, border:"none", color:"#fff", fontFamily:DM, fontSize:17, fontWeight:700, cursor:"pointer", marginBottom:12, boxShadow:"0 8px 32px rgba(75,193,160,0.4)" }}>
Find my people →
</button>
<button onClick={onLogin} style={{ width:"100%", padding:"16px", borderRadius:16, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.14)", color:"rgba(255,255,255,0.65)", fontFamily:DM, fontSize:16, cursor:"pointer" }}>
I already have an account
</button>
</div>
</div>
);
}

// ── Login ────────────────────────────────────────────────────────────────────
function LoginScreen({ onComplete, onBack }) {
const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
const [showPw, setShowPw] = useState(false); const [loading, setLoading] = useState(false);
const [errors, setErrors] = useState({});
const fStyle = (err, val) => ({ width:"100%", padding:"15px 16px", borderRadius:14, border:`1.5px solid ${err?"#D05657":val?C.accent:"rgba(255,255,255,0.14)"}`, background:val?"rgba(75,193,160,0.06)":"rgba(255,255,255,0.05)", color:"#fff", fontFamily:DM, fontSize:15, outline:"none", boxSizing:"border-box" });
const handleLogin = () => {
const e={};
if (!email.trim()||!/^[^\s@]+@[^\s@]+.[^\s@]+$/.test(email)) e.email="Valid email required";
if (!password.trim()||password.length<6) e.password="Password required";
setErrors(e); if(Object.keys(e).length) return;
setLoading(true); setTimeout(()=>{setLoading(false);onComplete();},1000);
};
return (
<div style={{ flex:1, display:"flex", flexDirection:"column", background:"#021a16", position:"relative", overflow:"hidden" }}>
<BlobBackground />
<div style={{ position:"relative", padding:"60px 32px 0", flexShrink:0 }}>
<button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:5, background:"none", border:"none", color:"rgba(255,255,255,0.45)", cursor:"pointer", fontFamily:DM, fontSize:14, padding:0, marginBottom:24 }}>
<svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
Back
</button>
<div style={{ fontFamily:DM, fontSize:46, fontWeight:700, color:"#fff", letterSpacing:-1, marginBottom:20 }}>chins</div>
<div style={{ fontFamily:DM, fontSize:22, fontWeight:700, color:"#fff", letterSpacing:-0.3 }}>Good to see you again.</div>
</div>
<div style={{ flex:1, padding:"28px 28px 0", display:"flex", flexDirection:"column", gap:14, position:"relative" }}>
<div>
<div style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.48)", marginBottom:8, fontFamily:DM }}>Email</div>
<input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErrors(x=>({...x,email:""}))}} placeholder="you@example.com" style={fStyle(errors.email,email)}/>
{errors.email&&<div style={{ fontSize:12,color:"#E1814C",marginTop:5,fontFamily:DM }}>{errors.email}</div>}
</div>
<div>
<div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
<div style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.48)", fontFamily:DM }}>Password</div>
<span style={{ fontSize:13, color:C.accent, cursor:"pointer", fontFamily:DM }}>Forgot?</span>
</div>
<div style={{ position:"relative" }}>
<input type={showPw?"text":"password"} value={password} onChange={e=>{setPassword(e.target.value);setErrors(x=>({...x,password:""}))}} placeholder="••••••••" style={{...fStyle(errors.password,password),paddingRight:48}}/>
<button onClick={()=>setShowPw(v=>!v)} style={{ position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,padding:0 }}>{showPw?"🙈":"👁️"}</button>
</div>
{errors.password&&<div style={{ fontSize:12,color:"#E1814C",marginTop:5,fontFamily:DM }}>{errors.password}</div>}
</div>
</div>
<div style={{ padding:"20px 28px 44px", position:"relative" }}>
<button onClick={handleLogin} disabled={loading} style={{ width:"100%", padding:"17px", borderRadius:16, border:"none", background:loading?"rgba(75,193,160,0.5)":C.accent, color:"#fff", fontFamily:DM, fontSize:16, fontWeight:700, cursor:"pointer", boxShadow:"0 6px 24px rgba(75,193,160,0.35)", marginBottom:14 }}>
{loading?"Signing in...":"Sign in →"}
</button>
<div style={{ textAlign:"center", fontSize:14, color:"rgba(255,255,255,0.3)", fontFamily:DM }}>
New here? <span onClick={onBack} style={{ color:C.accent, cursor:"pointer", fontWeight:600 }}>Create an account</span>
</div>
</div>
</div>
);
}

// ── Sign Up ──────────────────────────────────────────────────────────────────
function SignupScreen({ onComplete, onBack }) {
const [step, setStep] = useState(1);
const [form, setForm] = useState({ firstName:"", lastName:"", gender:"", dob:"", email:"", mobile:"" });
const [errors, setErrors] = useState({});
const [showGender, setShowGender] = useState(false);
const [ageBlocked, setAgeBlocked] = useState(false);

// Max DOB = 18 years ago today (can’t select a date that would make you under 18)
const maxDob = (() => {
const d = new Date();
d.setFullYear(d.getFullYear() - 18);
return d.toISOString().split("T")[0];
})();

const getAge = (dob) => (new Date() - new Date(dob)) / (1000*60*60*24*365.25);

const set = (k, v) => {
setForm(f => ({ ...f, [k]:v }));
setErrors(e => ({ ...e, [k]:"" }));
};

const fStyle = (key) => ({ width:"100%", padding:"15px 16px", borderRadius:14, border:`1.5px solid ${errors[key]?"#D05657":form[key]?C.accent:"rgba(255,255,255,0.14)"}`, background:form[key]?"rgba(75,193,160,0.06)":"rgba(255,255,255,0.05)", color:"#fff", fontFamily:DM, fontSize:15, outline:"none", boxSizing:"border-box" });
const lbl = { fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.48)", marginBottom:8, display:"block", fontFamily:DM };
const err = { fontSize:12, color:"#E1814C", marginTop:5, fontFamily:DM };

const v1 = () => {
const e={};
if(!form.firstName.trim()) e.firstName="Required";
if(!form.lastName.trim()) e.lastName="Required";
if(!form.gender) e.gender="Required";
if(!form.dob) e.dob="Required";
else if(getAge(form.dob) < 18) { e.dob="You must be 18 or older to join Chins"; setAgeBlocked(true); }
setErrors(e); return !Object.keys(e).length;
};
const v2 = () => {
const e={};
if(!form.email.trim()||!/^[^\s@]+@[^\s@]+.[^\s@]+$/.test(form.email)) e.email="Valid email required";
if(!form.mobile.trim()||form.mobile.length<7) e.mobile="Valid number required";
setErrors(e); return !Object.keys(e).length;
};

// Hard block screen for under-18s
if (ageBlocked) return (
<div style={{ flex:1, display:"flex", flexDirection:"column", background:"#021a16", position:"relative", overflow:"hidden" }}>
<BlobBackground overlayStrength="0.9" />
<div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 32px", position:"relative", textAlign:"center" }}>
<div style={{ fontSize:56, marginBottom:20 }}>🔒</div>
<div style={{ fontFamily:DM, fontSize:24, fontWeight:700, color:"#fff", letterSpacing:-0.4, marginBottom:14 }}>
You must be 18 or older to join Chins
</div>
<div style={{ fontFamily:DM, fontSize:15, color:"rgba(255,255,255,0.55)", lineHeight:1.7, marginBottom:36 }}>
Chins is designed for adults only. We take this seriously and do not allow anyone under 18 to create an account.
</div>
<button onClick={onBack} style={{ padding:"14px 32px", borderRadius:16, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.7)", fontFamily:DM, fontSize:15, cursor:"pointer" }}>
Go back
</button>
</div>
</div>
);

return (
<div style={{ flex:1, display:"flex", flexDirection:"column", background:"#021a16", overflow:"hidden", position:"relative" }}>
<BlobBackground />
<div style={{ position:"relative", padding:"60px 32px 0", flexShrink:0 }}>
<button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:5, background:"none", border:"none", color:"rgba(255,255,255,0.45)", cursor:"pointer", fontFamily:DM, fontSize:14, padding:0, marginBottom:20 }}>
<svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
Back
</button>
<div style={{ fontFamily:DM, fontSize:46, fontWeight:700, color:"#fff", letterSpacing:-1, lineHeight:1, marginBottom:20 }}>chins</div>
<div style={{ fontFamily:DM, fontSize:22, fontWeight:700, color:"#fff", letterSpacing:-0.3, marginBottom:14 }}>
{step===1?"Tell us about you":"How can we reach you?"}
</div>
<div style={{ display:"flex", gap:6 }}>
<div style={{ height:6, width:step===1?24:8, borderRadius:3, background:C.accent, transition:"all 0.3s" }}/>
<div style={{ height:6, width:step===2?24:8, borderRadius:3, background:step===2?C.accent:"rgba(255,255,255,0.15)", transition:"all 0.3s" }}/>
</div>
</div>
<div style={{ flex:1, overflowY:"auto", padding:"20px 28px 0", position:"relative" }}>
{step===1&&(
<div style={{ display:"flex", flexDirection:"column", gap:14 }}>
<div><label style={lbl}>First name</label><input value={form.firstName} onChange={e=>set("firstName",e.target.value)} placeholder="Your first name" style={fStyle("firstName")}/>{errors.firstName&&<div style={err}>{errors.firstName}</div>}</div>
<div><label style={lbl}>Last name</label><input value={form.lastName} onChange={e=>set("lastName",e.target.value)} placeholder="Your last name" style={fStyle("lastName")}/>{errors.lastName&&<div style={err}>{errors.lastName}</div>}</div>
<div>
<label style={lbl}>Gender</label>
<div onClick={()=>setShowGender(!showGender)} style={{...fStyle("gender"),cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<span style={{ color:form.gender?"#fff":"rgba(255,255,255,0.28)" }}>{form.gender||"Select"}</span>
<span style={{ color:"rgba(255,255,255,0.28)",fontSize:11 }}>{showGender?"▲":"▼"}</span>
</div>
{showGender&&<div style={{ background:"#0a2e20",border:"1px solid rgba(75,193,160,0.22)",borderRadius:14,marginTop:4,overflow:"hidden",zIndex:10,position:"relative" }}>
{["Man","Woman","Non-binary","Prefer not to say","Other"].map(g=>(
<div key={g} onClick={()=>{set("gender",g);setShowGender(false);}} style={{ padding:"13px 16px",color:"#fff",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,0.06)",fontSize:15,fontFamily:DM }}>{g}</div>
))}
</div>}
{errors.gender&&<div style={err}>{errors.gender}</div>}
</div>
<div>
<label style={lbl}>Date of birth</label>
<input
type="date"
value={form.dob}
onChange={e=>set("dob",e.target.value)}
max={maxDob}
style={{...fStyle("dob"),colorScheme:"dark"}}
/>
{errors.dob&&<div style={err}>{errors.dob}</div>}
<div style={{ fontSize:11, color:"rgba(255,255,255,0.28)", marginTop:6, fontFamily:DM }}>You must be 18 or older to join</div>
</div>
</div>
)}
{step===2&&(
<div style={{ display:"flex", flexDirection:"column", gap:14 }}>
<div><label style={lbl}>Email address</label><input type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="you@example.com" style={fStyle("email")}/>{errors.email&&<div style={err}>{errors.email}</div>}</div>
<div><label style={lbl}>Mobile number</label><input type="tel" value={form.mobile} onChange={e=>set("mobile",e.target.value)} placeholder="+44 7xxx xxxxxx" style={fStyle("mobile")}/>{errors.mobile&&<div style={err}>{errors.mobile}</div>}</div>
<div style={{ padding:"13px 16px",background:"rgba(255,255,255,0.04)",borderRadius:14,border:"1px solid rgba(255,255,255,0.07)" }}>
<div style={{ fontSize:12,color:"rgba(255,255,255,0.38)",lineHeight:1.6,fontFamily:DM }}>By continuing you agree to our <span style={{ color:C.accent,cursor:"pointer" }}>Terms</span> and <span style={{ color:C.accent,cursor:"pointer" }}>Privacy Policy</span>.</div>
</div>
</div>
)}
<div style={{ height:24 }}/>
</div>
<div style={{ padding:"16px 28px 44px", flexShrink:0, position:"relative" }}>
<button onClick={()=>{ if(step===1){if(v1())setStep(2);}else{if(v2())onComplete(form);}}} style={{ width:"100%",padding:"17px",borderRadius:16,border:"none",background:C.accent,color:"#fff",fontFamily:DM,fontSize:16,fontWeight:700,cursor:"pointer",boxShadow:"0 6px 24px rgba(75,193,160,0.3)" }}>
{step===1?"Continue →":"Create my account →"}
</button>
</div>
</div>
);
}

// ── Privacy & Terms ──────────────────────────────────────────────────────────
function PrivacyScreen({ onAccept }) {
const [scrolled, setScrolled] = useState(false);
const [checked, setChecked] = useState(false);
const scrollRef = useRef(null);
const handleScroll = () => {
const el = scrollRef.current;
if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 40) setScrolled(true);
};
const sections = [
{ title:"What we collect", body:"Your name, email, and mobile number to create your account. Your interests and conversation history with Reed to improve your matches. We do not collect your location. We do not track you across other apps." },
{ title:"How Reed works", body:"Reed is your personal AI companion on Chins. Reed gets to know you, keeps everything you share completely private, and never passes your information to anyone else. Conversations with Reed are used solely to improve your matches." },
{ title:"Your data, your control", body:"You can delete your account and all associated data at any time. You can switch between private and discoverable mode whenever you choose. You decide what, if anything, other users can see about you." },
{ title:"Who we share data with", body:"We do not sell your data. We do not share your data with advertisers. We may use third-party services for hosting and infrastructure, all of whom are bound by strict data processing agreements." },
{ title:"Your rights", body:"You have the right to access, correct, or delete your personal data at any time. Contact us at privacy@chins.app. We aim to respond within 48 hours." },
];
return (
<div style={{ flex:1, display:"flex", flexDirection:"column", background:"#021a16", position:"relative", overflow:"hidden" }}>
<BlobBackground overlayStrength="0.88" />
<div style={{ position:"relative", padding:"56px 28px 16px", flexShrink:0, borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
<div style={{ fontFamily:DM, fontSize:13, color:C.accent, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Before you continue</div>
<div style={{ fontFamily:DM, fontSize:24, fontWeight:700, color:"#fff", letterSpacing:-0.4 }}>Privacy & Terms</div>
<div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", marginTop:6, fontFamily:DM }}>Please read and scroll to the bottom to continue</div>
</div>
<div ref={scrollRef} onScroll={handleScroll} style={{ flex:1, overflowY:"auto", padding:"20px 28px", position:"relative" }}>
{sections.map((s,i) => (
<div key={i} style={{ marginBottom:24 }}>
<div style={{ fontFamily:DM, fontSize:15, fontWeight:700, color:"#fff", marginBottom:8 }}>{s.title}</div>
<div style={{ fontFamily:DM, fontSize:14, color:"rgba(255,255,255,0.6)", lineHeight:1.7 }}>{s.body}</div>
</div>
))}
<div style={{ padding:"16px", background:"rgba(75,193,160,0.08)", borderRadius:14, border:"1px solid rgba(75,193,160,0.2)", marginBottom:24 }}>
<div style={{ fontFamily:DM, fontSize:14, color:C.accent, lineHeight:1.7 }}>
Chins was built on a simple belief: you deserve to make real friends without sacrificing your privacy to do it.
</div>
</div>
<div style={{ height:8 }}/>
</div>
<div style={{ padding:"16px 28px 40px", flexShrink:0, position:"relative", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
<label style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer", marginBottom:20 }}>
<div onClick={()=>scrolled&&setChecked(c=>!c)} style={{ width:22, height:22, borderRadius:6, border:`2px solid ${checked?C.accent:"rgba(255,255,255,0.25)"}`, background:checked?C.accent:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", marginTop:1, cursor:scrolled?"pointer":"not-allowed" }}>
{checked&&<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
</div>
<div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.6, fontFamily:DM }}>
I have read and agree to the Privacy Policy and Terms of Service
</div>
</label>
<button onClick={()=>checked&&onAccept()} style={{ width:"100%", padding:"17px", borderRadius:16, border:"none", background:checked?C.accent:"rgba(255,255,255,0.1)", color:checked?"#fff":"rgba(255,255,255,0.3)", fontFamily:DM, fontSize:16, fontWeight:700, cursor:checked?"pointer":"not-allowed", transition:"all 0.2s" }}>
I agree, continue →
</button>
{!scrolled&&<div style={{ textAlign:"center", fontSize:12, color:"rgba(255,255,255,0.3)", marginTop:10, fontFamily:DM }}>Scroll through to enable</div>}
</div>
</div>
);
}

// ── Safety Tips ───────────────────────────────────────────────────────────────
function SafetyScreen({ onContinue }) {
const [current, setCurrent] = useState(0);
const tips = [
{
icon:"🛡️",
title:"Your safety is your responsibility",
body:"Chins can introduce you to people — but your safety is always in your hands. Trust your instincts. If something feels off, it probably is. No app can keep you safe; only you can do that.",
emphasis:true,
},
{
icon:"📍",
title:"Never share your location",
body:"Don’t share your home address, workplace, or regular routes with someone you haven’t met in person and trust. Your location is one of the most sensitive pieces of information you have.",
},
{
icon:"🔒",
title:"Protect your personal information",
body:"Keep your full name, employer, financial details, and personal contact information private until you feel genuinely comfortable. There’s no rush.",
},
{
icon:"☕",
title:"First meetings — public places only",
body:"Always meet someone new in a busy public place. Tell a friend or family member where you’re going, who you’re meeting, and when to expect you back.",
},
{
icon:"🚨",
title:"Trust your gut",
body:"If a conversation makes you uncomfortable, stop it. You don’t owe anyone your time or attention. Block and report anyone who behaves inappropriately — it helps protect everyone.",
},
{
icon:"👥",
title:"Take your time",
body:"Real friendships develop slowly. Be wary of anyone who pushes for personal information quickly, asks for money, or tries to move the conversation off the app before you’re ready.",
},
];
const tip = tips[current];
return (
<div style={{ flex:1, display:"flex", flexDirection:"column", background:"#021a16", position:"relative", overflow:"hidden" }}>
<BlobBackground overlayStrength="0.88" />
<div style={{ position:"relative", padding:"56px 28px 0", flexShrink:0 }}>
<div style={{ fontFamily:DM, fontSize:13, color:C.accent, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Before you meet anyone</div>
<div style={{ fontFamily:DM, fontSize:24, fontWeight:700, color:"#fff", letterSpacing:-0.4 }}>Stay safe</div>
<div style={{ display:"flex", gap:5, marginTop:16 }}>
{tips.map((_,i) => (
<div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<=current?C.accent:"rgba(255,255,255,0.12)", transition:"background 0.3s" }}/>
))}
</div>
</div>
<div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 28px", position:"relative" }}>
<div style={{ fontSize:56, marginBottom:20, textAlign:"center" }}>{tip.icon}</div>
<div style={{ fontFamily:DM, fontSize:21, fontWeight:700, color:tip.emphasis?"#fff":"#fff", letterSpacing:-0.3, marginBottom:14, textAlign:"center" }}>
{tip.title}
</div>
<div style={{ fontFamily:DM, fontSize:15, color:"rgba(255,255,255,0.65)", lineHeight:1.75, textAlign:"center", maxWidth:300, margin:"0 auto" }}>
{tip.body}
</div>
{tip.emphasis && (
<div style={{ marginTop:20, padding:"14px 18px", background:"rgba(225,129,76,0.12)", borderRadius:14, border:"1px solid rgba(225,129,76,0.3)", textAlign:"center" }}>
<div style={{ fontFamily:DM, fontSize:13, color:C.amber, fontWeight:600, lineHeight:1.6 }}>
Chins is a tool for introductions — not a safety guarantee.
</div>
</div>
)}
</div>
<div style={{ padding:"16px 28px 44px", flexShrink:0, position:"relative" }}>
{current < tips.length - 1 ? (
<button onClick={()=>setCurrent(c=>c+1)} style={{ width:"100%", padding:"17px", borderRadius:16, border:"none", background:C.accent, color:"#fff", fontFamily:DM, fontSize:16, fontWeight:700, cursor:"pointer", boxShadow:"0 6px 24px rgba(75,193,160,0.3)" }}>
Next →
</button>
) : (
<button onClick={onContinue} style={{ width:"100%", padding:"17px", borderRadius:16, border:"none", background:C.accent, color:"#fff", fontFamily:DM, fontSize:16, fontWeight:700, cursor:"pointer", boxShadow:"0 6px 24px rgba(75,193,160,0.3)" }}>
I understand, let’s go →
</button>
)}
{current > 0 && (
<button onClick={()=>setCurrent(c=>c-1)} style={{ width:"100%", padding:"12px", borderRadius:16, border:"none", background:"none", color:"rgba(255,255,255,0.35)", fontFamily:DM, fontSize:14, cursor:"pointer", marginTop:8 }}>
← Back
</button>
)}
</div>
</div>
);
}

// ── Meet Reed ────────────────────────────────────────────────────────────────
function MeetReedScreen({ onComplete }) {
const [privacyMode, setPrivacyMode] = useState(null); // "private" | "discoverable"
const [step, setStep] = useState(0); // 0=intro, 1=how it works, 2=privacy choice

const screens = [
{
title:"Meet Reed.",
body:"Reed is your AI companion on Chins. Reed gets to know you, finds people you’d genuinely click with, and makes introductions on your behalf.\n\nEverything you share with Reed stays between you and Reed. Always.",
reedMood:"excited",
},
{
title:"The more Reed knows you, the better.",
body:"Reed will want to get to know you — your interests, your life, what you actually look for in people. The more honest you are, the better the matches.\n\nReed may suggest people you’ve already met. Give them a chance — Reed sees things you might miss.\n\nYou can talk to Reed by text or voice, whenever you want.",
reedMood:"curious",
},
];

if (step < 2) {
const s = screens[step];
return (
<div style={{ flex:1, display:"flex", flexDirection:"column", background:"#021a16", position:"relative", overflow:"hidden" }}>
<BlobBackground overlayStrength="0.85" />
<div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"60px 28px 0", position:"relative" }}>
<div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
<ReedCharacter mood={s.reedMood} size={72}/>
</div>
<div style={{ fontFamily:DM, fontSize:26, fontWeight:700, color:"#fff", letterSpacing:-0.5, marginBottom:16, textAlign:"center" }}>{s.title}</div>
{s.body.split("\n\n").map((p,i)=>(
<div key={i} style={{ fontFamily:DM, fontSize:15, color:"rgba(255,255,255,0.65)", lineHeight:1.75, marginBottom:12, textAlign:"center" }}>{p}</div>
))}
</div>
<div style={{ padding:"20px 28px 44px", flexShrink:0, position:"relative" }}>
<div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:20 }}>
{[0,1,2].map(i=>(
<div key={i} style={{ width:i===step?20:6, height:6, borderRadius:3, background:i<=step?C.accent:"rgba(255,255,255,0.15)", transition:"all 0.3s" }}/>
))}
</div>
<button onClick={()=>setStep(step+1)} style={{ width:"100%", padding:"17px", borderRadius:16, border:"none", background:C.accent, color:"#fff", fontFamily:DM, fontSize:16, fontWeight:700, cursor:"pointer", boxShadow:"0 6px 24px rgba(75,193,160,0.3)" }}>
{step===0?"How does it work? →":"Got it →"}
</button>
</div>
</div>
);
}

// Privacy choice
return (
<div style={{ flex:1, display:"flex", flexDirection:"column", background:"#021a16", position:"relative", overflow:"hidden" }}>
<BlobBackground overlayStrength="0.85" />
<div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"60px 28px 0", position:"relative" }}>
<div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
<ReedCharacter mood="curious" size={64}/>
</div>
<div style={{ fontFamily:DM, fontSize:24, fontWeight:700, color:"#fff", letterSpacing:-0.4, marginBottom:8, textAlign:"center" }}>One last thing.</div>
<div style={{ fontFamily:DM, fontSize:15, color:"rgba(255,255,255,0.6)", lineHeight:1.7, textAlign:"center", marginBottom:28 }}>
How visible do you want to be? You can change this anytime.
</div>
{[
{
id:"discoverable",
icon:"🌍",
title:"Discoverable",
desc:"Your alias and chosen interests appear on the Connect page. Others can see you. Reed still makes introductions — you’re just also findable.",
},
{
id:"private",
icon:"🔒",
title:"Private",
desc:"You don’t appear on anyone’s Connect page. The Connect page is locked for you too. Reed works entirely on your behalf — you’ll only hear from people Reed has hand-picked.",
},
].map(opt=>(
<div key={opt.id} onClick={()=>setPrivacyMode(opt.id)} style={{ marginBottom:12, padding:"18px", borderRadius:18, border:`2px solid ${privacyMode===opt.id?C.accent:"rgba(255,255,255,0.1)"}`, background:privacyMode===opt.id?C.accentDim:"rgba(255,255,255,0.04)", cursor:"pointer", transition:"all 0.2s" }}>
<div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
<span style={{ fontSize:24 }}>{opt.icon}</span>
<div style={{ fontFamily:DM, fontSize:16, fontWeight:700, color:"#fff" }}>{opt.title}</div>
{privacyMode===opt.id&&<div style={{ marginLeft:"auto", width:20, height:20, borderRadius:"50%", background:C.accent, display:"flex", alignItems:"center", justifyContent:"center" }}><svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/></svg></div>}
</div>
<div style={{ fontFamily:DM, fontSize:13, color:"rgba(255,255,255,0.55)", lineHeight:1.6 }}>{opt.desc}</div>
</div>
))}
</div>
<div style={{ padding:"16px 28px 44px", flexShrink:0, position:"relative" }}>
<div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:20 }}>
{[0,1,2].map(i=>(
<div key={i} style={{ width:i===2?20:6, height:6, borderRadius:3, background:i<=2?C.accent:"rgba(255,255,255,0.15)", transition:"all 0.3s" }}/>
))}
</div>
<button onClick={()=>privacyMode&&onComplete(privacyMode)} style={{ width:"100%", padding:"17px", borderRadius:16, border:"none", background:privacyMode?C.accent:"rgba(255,255,255,0.1)", color:privacyMode?"#fff":"rgba(255,255,255,0.3)", fontFamily:DM, fontSize:16, fontWeight:700, cursor:privacyMode?"pointer":"not-allowed", boxShadow:privacyMode?"0 6px 24px rgba(75,193,160,0.3)":"none", transition:"all 0.2s" }}>
Start talking to Reed →
</button>
</div>
</div>
);
}

// ── Reed Chat (main) ─────────────────────────────────────────────────────────
function ReedChat({ msgs, loading, input, setInput, send, profile, progress, chipAnimal, showAnimalToast, setShowAnimalToast, profileInsertIdx, privacyMode }) {
const endRef = useRef(null);
const isCompanion = !!profile;
const chipLabel = chipAnimal ? `Reed the ${chipAnimal.animal}` : "Reed";
useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs,loading]);

// Voice
const handleVoiceTranscript = useCallback((text) => {
setInput(text);
setTimeout(() => send(text), 100);
}, [send, setInput]);
const { listening, speaking, speak, startListening, stopListening } = useVoiceReed(handleVoiceTranscript);

// Speak latest Reed message
useEffect(() => {
const lastReed = [...msgs].reverse().find(m=>m.role==="reed");
if (lastReed?.text && isCompanion) speak(lastReed.text.slice(0,300));
}, [msgs.length]);

return (
<div style={{ flex:1, display:"flex", flexDirection:"column", background:C.bg, overflow:"hidden" }}>
{!isCompanion&&<div style={{ height:3, background:"rgba(255,255,255,0.1)" }}><div style={{ height:"100%", width:`${progress}%`, background:C.accent, transition:"width 0.5s" }}/></div>}
<div style={{ padding:"14px 20px 10px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, background:C.surface, flexShrink:0 }}>
<ReedCharacter mood={speaking?"excited":loading?"thinking":"idle"} size={36}/>
<div style={{ flex:1 }}>
<div style={{ fontWeight:700, color:C.text, fontSize:15, fontFamily:DM }}>{chipLabel}</div>
<div style={{ fontSize:11, color:speaking?C.accent:C.textDim, fontFamily:DM }}>
{speaking?"speaking...":loading?"thinking...":isCompanion?"your companion":"getting to know you"}
</div>
</div>
<div style={{ display:"flex", alignItems:"center", gap:8 }}>
{/* Voice call button */}
<button
onClick={listening?stopListening:startListening}
style={{ width:36, height:36, borderRadius:"50%", background:listening?"rgba(208,86,87,0.2)":C.accentDim, border:`1px solid ${listening?"rgba(208,86,87,0.5)":C.accentGlow}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}
>
{listening?"🔴":"🎙️"}
</button>
<div style={{ padding:"3px 10px", borderRadius:20, background:isCompanion?C.accentDim:"rgba(255,150,50,0.15)", border:`1px solid ${isCompanion?C.accentGlow:"rgba(255,150,50,0.3)"}`, color:isCompanion?C.accent:"#E1814C", fontSize:9, fontWeight:700, textTransform:"uppercase", fontFamily:DM }}>
{isCompanion?"companion":"onboarding"}
</div>
</div>
</div>
{showAnimalToast&&chipAnimal&&(
<div style={{ margin:"12px 16px 0", padding:"16px", background:C.accentDim, border:`1px solid ${C.accentGlow}`, borderRadius:16, textAlign:"center", position:"relative" }}>
<div style={{ fontSize:36, marginBottom:6 }}>{chipAnimal.emoji}</div>
<div style={{ fontFamily:DM, fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>Reed just became your {chipAnimal.animal}</div>
<button onClick={()=>setShowAnimalToast(false)} style={{ marginTop:8, padding:"7px 18px", borderRadius:20, background:C.accent, border:"none", color:"#fff", cursor:"pointer", fontWeight:600, fontFamily:DM }}>Love it!</button>
</div>
)}
{listening&&(
<div style={{ margin:"8px 16px 0", padding:"10px 14px", background:"rgba(208,86,87,0.1)", borderRadius:12, border:"1px solid rgba(208,86,87,0.3)", display:"flex", alignItems:"center", gap:8 }}>
<div style={{ width:8, height:8, borderRadius:"50%", background:"#D05657", animation:"pulse 1s infinite" }}/>
<div style={{ fontFamily:DM, fontSize:13, color:"#D05657" }}>Listening... speak now</div>
</div>
)}
<div style={{ flex:1, overflowY:"auto", padding:"12px 16px" }}>
{msgs.map((m,i)=>(
<div key={i}>
{profileInsertIdx!==null&&i===profileInsertIdx+1&&(
<div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0" }}>
<div style={{ flex:1, height:1, background:C.border }}/>
<div style={{ fontSize:11, color:C.accent, fontWeight:600, fontFamily:DM }}>Profile saved ✓</div>
<div style={{ flex:1, height:1, background:C.border }}/>
</div>
)}
<div style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", marginBottom:10 }}>
{m.role==="reed"&&<div style={{ marginRight:8, flexShrink:0 }}><ReedCharacter mood="idle" size={24}/></div>}
<div style={{ maxWidth:"78%", padding:"10px 14px", borderRadius:m.role==="reed"?"16px 16px 16px 4px":"16px 16px 4px 16px", background:m.role==="reed"?C.surface:C.accent, color:C.text, fontSize:14, lineHeight:1.6, fontFamily:DM, border:m.role==="reed"?`1px solid ${C.border}`:"none" }}>
{m.text}
</div>
</div>
</div>
))}
{loading&&<div style={{ display:"flex", gap:8, alignItems:"flex-end", marginBottom:10 }}><div style={{ marginRight:8 }}><ReedCharacter mood="thinking" size={24}/></div><div style={{ padding:"10px 14px", background:C.surface, borderRadius:"16px 16px 16px 4px", border:`1px solid ${C.border}` }}><Dots/></div></div>}

```
    <div ref={endRef}/>
  </div>
  <div style={{ padding:"10px 14px", borderTop:`1px solid ${C.border}`, display:"flex", gap:8, alignItems:"flex-end", flexShrink:0 }}>
    <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder={isCompanion?"talk to Reed...":"say something..."} rows={1} style={{ flex:1, padding:"11px 14px", borderRadius:22, border:`1px solid ${C.border}`, background:C.surface, color:C.text, resize:"none", fontFamily:DM, fontSize:14, outline:"none" }}/>
    <button onClick={()=>send()} disabled={!input.trim()||loading} style={{ width:42, height:42, borderRadius:"50%", background:input.trim()&&!loading?C.accent:"rgba(255,255,255,0.1)", border:"none", cursor:"pointer", color:"#fff", fontSize:18, transition:"background 0.2s" }}>↑</button>
  </div>
</div>
```

);
}

// ── Voice Note Player ──────────────────────────────────────────────────────────
function VoiceNotePlayer({ duration, isMe }) {
const [playing, setPlaying] = useState(false);
const [progress, setProgress] = useState(0);
const bars = [3,5,8,6,10,7,9,5,8,4,7,9,6,8,5,10,7,6,8,4,9,6,8,5,7];
const timerRef = useRef(null);
const toggle = () => {
if(playing){ clearInterval(timerRef.current); setPlaying(false); return; }
setPlaying(true);
const total=duration*1000, start=Date.now()-(progress/100)*total;
timerRef.current=setInterval(()=>{ const p=Math.min(100,((Date.now()-start)/total)*100); setProgress(p); if(p>=100){clearInterval(timerRef.current);setPlaying(false);setProgress(0);} },50);
};
useEffect(()=>()=>clearInterval(timerRef.current),[]);
const fmt=s=>Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
const activeBg=isMe?"rgba(255,255,255,0.9)":C.accent, inactiveBg=isMe?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.2)";
return (
<div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:20, background:isMe?"rgba(255,255,255,0.15)":C.surface, minWidth:180, maxWidth:240, border:isMe?"none":"1px solid "+C.border+")"}}>
<button onClick={toggle} style={{ width:32, height:32, borderRadius:"50%", background:isMe?"rgba(255,255,255,0.2)":C.accentDim, border:`1px solid ${isMe?"rgba(255,255,255,0.3)":C.accentGlow}`, cursor:"pointer", color:isMe?"#fff":C.accent, fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{playing?"⏸":"▶"}</button>
<div style={{ flex:1, display:"flex", alignItems:"center", gap:1.5, height:22 }}>{bars.map((h,i)=><div key={i} style={{ width:2.5, height:h, borderRadius:2, background:i/bars.length<progress/100?activeBg:inactiveBg }}/>)}</div>
<div style={{ fontSize:10, color:isMe?"rgba(255,255,255,0.7)":C.textDim, flexShrink:0 }}>{playing?fmt(Math.round((progress/100)*duration)):fmt(duration)}</div>
</div>
);
}

// ── Chat Input Bar ─────────────────────────────────────────────────────────────
function ChatInputBar({ placeholder, value, onChange, onSend, onKeyDown, onVoiceSend, onPhotoSend }) {
const [recording, setRecording] = useState(false);
const [seconds, setSeconds] = useState(0);
const timerRef = useRef(null);
const fileRef = useRef(null);
const startRec = () => { setRecording(true); setSeconds(0); timerRef.current=setInterval(()=>setSeconds(s=>{ if(s+1>=60){stopRec(s+1);return s+1;}return s+1; }),1000); };
const stopRec = (s) => { clearInterval(timerRef.current); setRecording(false); const dur=typeof s==="number"?s:seconds; if(dur>0)onVoiceSend(dur); setSeconds(0); };
const fmt=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
if(recording) return (
<div style={{ padding:"10px 16px", borderTop:`1px solid ${C.border}`, display:"flex", gap:8, alignItems:"center" }}>
<div style={{ flex:1, display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"rgba(208,86,87,0.1)", borderRadius:24, border:"1px solid rgba(208,86,87,0.3)" }}>
<div style={{ width:8, height:8, borderRadius:"50%", background:"#D05657", animation:"pulse 1s ease-in-out infinite" }}/>
<div style={{ display:"flex", alignItems:"center", gap:2, flex:1, height:20 }}>{Array.from({length:18},(_,i)=><div key={i} style={{ width:2.5, height:4+Math.sin(i*0.8)*6, borderRadius:2, background:"#D05657", opacity:0.7 }}/>)}</div>
<div style={{ fontSize:12, color:"#D05657", fontWeight:600 }}>{fmt(seconds)}</div>
</div>
<button onClick={()=>stopRec(seconds)} style={{ width:44, height:44, borderRadius:"50%", background:C.accent, border:"none", cursor:"pointer", color:"#fff", fontSize:18 }}>✓</button>
<button onClick={()=>{clearInterval(timerRef.current);setRecording(false);setSeconds(0);}} style={{ width:44, height:44, borderRadius:"50%", background:"rgba(255,255,255,0.08)", border:`1px solid ${C.border}`, cursor:"pointer", color:C.textDim, fontSize:16 }}>✕</button>
</div>
);
return (
<div style={{ padding:"10px 16px", borderTop:`1px solid ${C.border}`, display:"flex", gap:8, alignItems:"flex-end" }}>
<input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ const f=e.target.files[0]; if(f){onPhotoSend(URL.createObjectURL(f));} e.target.value=""; }}/>
<button onClick={()=>fileRef.current?.click()} style={{ width:40, height:40, borderRadius:"50%", background:"none", border:`1px solid ${C.border}`, cursor:"pointer", color:C.textDim, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4"/><circle cx="8" cy="8" r="2.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4"/></svg>
</button>
<div style={{ flex:1, padding:"10px 14px", background:C.surface, borderRadius:24, border:`1px solid ${C.border}` }}>
<textarea value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder} rows={1} style={{ width:"100%", background:"none", border:"none", color:C.text, fontFamily:DM, fontSize:14, outline:"none", resize:"none", lineHeight:1.4 }}/>
</div>
{value.trim()
? <button onClick={onSend} style={{ width:40, height:40, borderRadius:"50%", background:C.accent, border:"none", cursor:"pointer", color:"#fff", fontSize:18, flexShrink:0 }}>↑</button>
: <button onMouseDown={startRec} onTouchStart={startRec} style={{ width:40, height:40, borderRadius:"50%", background:"none", border:`1px solid ${C.border}`, cursor:"pointer", color:C.textDim, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>🎙️</button>
}
</div>
);
}

// ── Person Profile View ────────────────────────────────────────────────────────
function PersonProfileView({ person, userProfile, connectionCount, onBack, onConnect }) {
const [phase, setPhase] = useState("ask");
const [askText, setAskText] = useState(null);
const [askLoading, setAskLoading] = useState(true);
const [syncResult, setSyncResult] = useState(null);
const [connected, setConnected] = useState(false);
const [nudge, setNudge] = useState(null);
const [chatMsgs, setChatMsgs] = useState([]);
const [chatInput, setChatInput] = useState("");
const [agentMsgs, setAgentMsgs] = useState([]);
const endRef = useRef(null);
useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[chatMsgs]);

useEffect(()=>{
(async()=>{
try { const text=await callAI(`You are Reed on Chins. User wants to know about connecting with ${person.alias}. Their interests: ${person.interests.join(", ")}. Vibe: "${person.vibe}". Say something short and personal — like a friend whispering "psst" — pointing out why they should connect. 1-2 sentences.`,null,100); setAskText(text); }
catch { setAskText(`${person.alias} seems like someone worth a conversation.`); }
setAskLoading(false);
})();
},[]);

const addAgentMsg=(role,text,delay=0)=>new Promise(res=>setTimeout(()=>{setAgentMsgs(prev=>[...prev,{role,text}]);res();},delay));

const handleYes=async()=>{
setPhase("syncing");
try {
await addAgentMsg("reed",`Quick sync re: ${person.alias}?`,0);
await addAgentMsg("them",`${person.alias}'s agent here — go ahead.`,1200);
const report=await callAI(`You are ${person.alias}'s AI agent on Chins. Reply as their agent about compatibility in 2-3 short natural sentences.`,null,150);
const lines=report.split(/\n+/).filter(l=>l.trim().length>8).slice(0,3);
if(lines[0]) await addAgentMsg("them",lines[0],800);
if(lines[1]) await addAgentMsg("reed",lines[1],1000);
if(lines[2]) await addAgentMsg("them",lines[2],900);
await addAgentMsg("reed","Got it — looping back to my user. 💚",700);
await new Promise(r=>setTimeout(r,500));
const summary=await callAI(`You are Reed. You just synced with ${person.alias}'s agent. Tell the user your honest read in 1-2 warm sentences.`,null,100);
setSyncResult(summary);
} catch { setSyncResult("My gut says go for it."); }
setPhase("result");
};

const handleConnect=async()=>{
setPhase("connecting");
try { const opener=await callAI(`You are Reed. Write one warm opener for the user to send to ${person.alias}. 1-2 sentences. Start with "Hey ${person.alias},"`,null,100); setChatMsgs([{sender:"reed-sent",text:opener}]); }
catch { setChatMsgs([{sender:"reed-sent",text:`Hey ${person.alias}, Reed thought we'd get along — seems right to me.`}]); }
setConnected(true); onConnect(person);
};

const sendChat=()=>{ if(!chatInput.trim()) return; setChatMsgs(prev=>[...prev,{sender:"me",text:chatInput.trim()}]); setChatInput(""); };

if(connected) return (
<div style={{ position:"absolute", inset:0, background:C.bg, zIndex:200, display:"flex", flexDirection:"column" }}>
<div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, background:C.surface }}>
<button onClick={onBack} style={{ background:"none", border:"none", color:C.text, fontSize:20, cursor:"pointer" }}>←</button>
<div style={{ width:36, height:36, borderRadius:"50%", overflow:"hidden", background:person.gradient }}>
<img src={personPhoto(person.id,72)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.style.display="none";}}/>
</div>
<div><div style={{ fontWeight:600, color:C.text, fontFamily:DM }}>{person.alias}</div><div style={{ fontSize:11, color:C.accent, fontFamily:DM }}>● Active now</div></div>
</div>
{nudge&&<div style={{ margin:"12px 16px 0", padding:"10px 14px", background:C.accentDim, borderRadius:14, border:`1px solid ${C.accentGlow}`, display:"flex", gap:10 }}><ReedAvatar size={22}/><div style={{ fontSize:12, color:C.accent, lineHeight:1.6, fontFamily:DM }}>{nudge}</div></div>}
<div style={{ flex:1, overflowY:"auto", padding:"12px 16px" }}>
{chatMsgs.map((m,i)=>(
<div key={i} style={{ marginBottom:10 }}>
{m.sender==="reed-sent"&&<div style={{ display:"flex", gap:8, alignItems:"flex-end" }}><ReedAvatar size={28}/><div style={{ maxWidth:"75%", padding:"10px 14px", background:C.surface, borderRadius:"16px 16px 16px 4px", color:C.text, fontSize:14, border:`1px solid ${C.border}`, fontFamily:DM }}>{m.text}</div></div>}
{m.sender==="me"&&<div style={{ display:"flex", justifyContent:"flex-end" }}><div style={{ maxWidth:"75%", padding:"10px 14px", background:C.accent, borderRadius:"16px 16px 4px 16px", color:"#fff", fontSize:14, fontFamily:DM }}>{m.text}</div></div>}
{m.type==="voice"&&<div style={{ display:"flex", justifyContent:"flex-end" }}><VoiceNotePlayer duration={m.duration} isMe={true}/></div>}
{m.type==="photo"&&<div style={{ display:"flex", justifyContent:"flex-end" }}><img src={m.url} style={{ maxWidth:180, borderRadius:14 }} alt=""/></div>}
</div>
))}
<div ref={endRef}/>
</div>
<ChatInputBar placeholder={`Message ${person.alias}...`} value={chatInput} onChange={e=>setChatInput(e.target.value)} onSend={sendChat} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();}}} onVoiceSend={dur=>setChatMsgs(prev=>[...prev,{sender:"me",type:"voice",duration:dur}])} onPhotoSend={url=>setChatMsgs(prev=>[...prev,{sender:"me",type:"photo",url}])}/>
</div>
);

return (
<div style={{ position:"absolute", inset:0, background:C.bg, zIndex:100, overflowY:"auto" }}>
<div style={{ height:240, position:"relative", overflow:"hidden" }}>
<div style={{ position:"absolute", inset:0, background:person.gradient }}/>
<img src={personPhoto(person.id,400)} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", mixBlendMode:"overlay", opacity:0.5 }} onError={e=>{e.target.style.display="none";}}/>
<div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(5,74,67,0.9) 100%)" }}/>
<button onClick={onBack} style={{ position:"absolute", top:16, left:16, background:"rgba(0,0,0,0.35)", border:"none", color:"#fff", width:36, height:36, borderRadius:"50%", cursor:"pointer", fontSize:18 }}>←</button>
<div style={{ position:"absolute", bottom:20, left:20 }}>
<div style={{ fontFamily:DM, fontSize:24, fontWeight:700, color:"#fff" }}>{person.alias}</div>
{person.vibe&&<div style={{ fontSize:13, color:"rgba(255,255,255,0.75)", marginTop:3, fontStyle:"italic", fontFamily:DM }}>"{person.vibe}"</div>}
</div>
</div>
<div style={{ padding:"20px" }}>
<div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
{person.interests.map(i=><span key={i} style={{ padding:"6px 14px", borderRadius:20, background:C.accentDim, border:`1px solid ${C.accentGlow}`, color:C.accent, fontSize:13, fontFamily:DM }}>{i}</span>)}
</div>
<div style={{ background:C.surface, borderRadius:20, border:`1px solid ${C.border}`, overflow:"hidden" }}>
<div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", gap:10, alignItems:"center" }}>
<ReedAvatar size={28}/><div style={{ fontSize:13, fontWeight:600, color:C.text, fontFamily:DM }}>Reed</div>
</div>
<div style={{ padding:"14px 16px" }}>
{phase==="ask"&&(askLoading?<Dots/>:<><div style={{ fontSize:14, color:C.text, lineHeight:1.6, marginBottom:14, fontFamily:DM }}>{askText}</div><div style={{ display:"flex", gap:8 }}><button onClick={handleYes} style={{ flex:1, padding:"10px", borderRadius:12, background:C.accent, border:"none", color:"#fff", cursor:"pointer", fontWeight:600, fontFamily:DM, fontSize:13 }}>Check with their agent</button><button onClick={handleConnect} style={{ flex:1, padding:"10px", borderRadius:12, background:C.surface, border:`1px solid ${C.border}`, color:C.text, cursor:"pointer", fontFamily:DM, fontSize:13 }}>Connect directly</button></div></>)}
{phase==="syncing"&&<div>{agentMsgs.map((m,i)=><div key={i} style={{ marginBottom:8, display:"flex", justifyContent:m.role==="reed"?"flex-start":"flex-end" }}><div style={{ maxWidth:"80%", padding:"8px 12px", borderRadius:12, background:m.role==="reed"?C.accentDim:"rgba(75,193,160,0.25)", color:C.text, fontSize:13, fontFamily:DM }}>{m.text}</div></div>)}{agentMsgs.length<3&&<Dots/>}</div>}
{phase==="result"&&<><div style={{ fontSize:14, color:C.text, lineHeight:1.6, marginBottom:14, fontFamily:DM }}>{syncResult}</div><button onClick={handleConnect} style={{ width:"100%", padding:"12px", borderRadius:14, background:C.accent, border:"none", color:"#fff", cursor:"pointer", fontWeight:600, fontSize:15, fontFamily:DM }}>Connect with {person.alias} →</button></>}
{phase==="connecting"&&<div style={{ color:C.accent, textAlign:"center", fontFamily:DM }}>Connecting...</div>}
</div>
</div>
</div>
</div>
);
}

function ConnectScreen({ userProfile, connectionCount, onConnect, privacyMode, onGoToReed, chipAnimal }) {
const frameRef = useRef(null);
const tileRefs = useRef({});
const [openedPerson, setOpenedPerson] = useState(null);
const [reedPos, setReedPos] = useState({ x:260, y:400 });
const [reedMood, setReedMood] = useState("sitting");
const [reedFlipped, setReedFlipped] = useState(false);
const [reedBubble, setReedBubble] = useState(null);
const [dragging, setDragging] = useState(false);
const [dragOffset, setDragOffset] = useState({ x:0, y:0 });
const [isAnimating, setIsAnimating] = useState(false);
const [matchTarget, setMatchTarget] = useState(null);
const matchDone = useRef(false);
const reedRef = useRef(null);

const isPrivate = privacyMode === "private";

const runToMatch = async () => {
if (isAnimating || matchDone.current) return;
matchDone.current = true;
setIsAnimating(true);
setReedMood("thinking");
setReedBubble({ text:"give me a sec...", type:"thinking" });
await new Promise(r=>setTimeout(r,1500));
try {
const raw = await callAI(
`You are Reed. Pick one person from this list as a great match for the user. User: ${JSON.stringify(userProfile||{name:"you",interests:["meeting people"]})} People: ${JSON.stringify(NEARBY.map(p=>({id:p.id,alias:p.alias,interests:p.interests,vibe:p.vibe})))} Reply ONLY in JSON: {"matchId":<number>,"message":"<casual 1-sentence why, mention their alias>"}`,
null, 120
);
const json = JSON.parse(raw.replace(/`json|`/g,"").trim());
const person = NEARBY.find(p=>p.id===json.matchId)||NEARBY[0];
setMatchTarget(person);
const frame = frameRef.current;
const tile = tileRefs.current[person.id];
if (frame && tile) {
const fRect = frame.getBoundingClientRect();
const tRect = tile.getBoundingClientRect();
const tx = tRect.left - fRect.left + tRect.width/2 - 26;
const ty = tRect.top - fRect.top - 20;
setReedFlipped(tx < reedPos.x);
setReedMood("running");
setReedBubble(null);
const steps=20, sx=reedPos.x, sy=reedPos.y;
for(let i=1;i<=steps;i++){
await new Promise(r=>setTimeout(r,35));
setReedPos({ x:sx+(tx-sx)*(i/steps), y:sy+(ty-sy)*(i/steps) });
}
}
setReedMood("excited");
setReedFlipped(false);
setReedBubble({ text:json.message, type:"match", person });
} catch {
const p = NEARBY[0];
setMatchTarget(p);
setReedMood("excited");
setReedBubble({ text:`okay — ${p.alias} has your energy. just saying.`, type:"match", person:p });
}
setIsAnimating(false);
};

useEffect(()=>{ const t=setTimeout(()=>{ if(!matchDone.current) runToMatch(); },3500); return()=>clearTimeout(t); },[]);

const onReedDown = (e) => {
e.stopPropagation();
const cx=e.touches?e.touches[0].clientX:e.clientX;
const cy=e.touches?e.touches[0].clientY:e.clientY;
const r=reedRef.current?.getBoundingClientRect();
if(r) setDragOffset({ x:cx-r.left-r.width/2, y:cy-r.top-r.height/2 });
setDragging(true); setReedMood("excited"); setReedBubble(null); setMatchTarget(null);
};

useEffect(()=>{
if(!dragging) return;
const frame=frameRef.current;
const mv=(cx,cy)=>{ if(!frame) return; const rect=frame.getBoundingClientRect(); setReedPos({ x:Math.max(0,Math.min(rect.width-52,cx-rect.left-dragOffset.x)), y:Math.max(0,Math.min(rect.height-80,cy-rect.top-dragOffset.y)) }); };
const mm=e=>mv(e.clientX,e.clientY);
const tm=e=>{ if(e.touches[0]) mv(e.touches[0].clientX,e.touches[0].clientY); };
const up=()=>{ setDragging(false); setReedMood("idle"); setTimeout(()=>setReedMood("sitting"),2500); };
window.addEventListener("mousemove",mm); window.addEventListener("mouseup",up);
window.addEventListener("touchmove",tm,{passive:true}); window.addEventListener("touchend",up);
return()=>{ window.removeEventListener("mousemove",mm); window.removeEventListener("mouseup",up); window.removeEventListener("touchmove",tm); window.removeEventListener("touchend",up); };
},[dragging,dragOffset]);

return (
<div ref={frameRef} style={{ flex:1, display:"flex", flexDirection:"column", background:C.bg, overflow:"hidden", position:"relative" }}>
{/* PersonProfileView overlay */}
{openedPerson&&(
<div style={{ position:"absolute", inset:0, zIndex:50 }}>
<PersonProfileView person={openedPerson} userProfile={userProfile} connectionCount={connectionCount} onBack={()=>setOpenedPerson(null)} onConnect={p=>{onConnect(p);setOpenedPerson(null);}}/>
</div>
)}

```
  <div style={{ padding:"18px 20px 10px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:22, fontWeight:700, color:C.text }}>Connect</div>
    <div style={{ fontSize:12, color:C.textDim, marginTop:2, fontFamily:DM }}>
      {isPrivate ? "Private mode — Reed is working for you" : "People nearby who might just become your people"}
    </div>
  </div>

  {isPrivate ? (
    // Private mode — blurred/locked
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 28px", position:"relative" }}>
      {/* Blurred grid behind */}
      <div style={{ position:"absolute", inset:0, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, padding:"16px", filter:"blur(12px)", opacity:0.35 }}>
        {NEARBY.slice(0,6).map(p=>(
          <div key={p.id} style={{ borderRadius:18, background:p.gradient, height:120 }}/>
        ))}
      </div>
      <div style={{ position:"absolute", inset:0, background:"rgba(5,74,67,0.75)" }}/>
      <div style={{ position:"relative", textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
        <div style={{ fontFamily:DM, fontSize:18, fontWeight:700, color:"#fff", marginBottom:10 }}>You're in private mode</div>
        <div style={{ fontFamily:DM, fontSize:14, color:"rgba(255,255,255,0.6)", lineHeight:1.7, marginBottom:24 }}>
          You don't appear to others, and the Connect page is locked for you. Reed is working behind the scenes to find your people.
        </div>
        <button onClick={onGoToReed} style={{ padding:"13px 24px", borderRadius:16, background:C.accent, border:"none", color:"#fff", fontFamily:DM, fontSize:15, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 20px rgba(75,193,160,0.35)" }}>
          Talk to Reed →
        </button>
        <div style={{ marginTop:14, fontFamily:DM, fontSize:12, color:"rgba(255,255,255,0.3)" }}>
          Switch to discoverable in Settings
        </div>
      </div>
    </div>
  ) : (
    // Discoverable mode — floating tiles + Reed
    <div style={{ flex:1, overflowY:"auto", padding:"12px 14px 120px" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
        {NEARBY.map((p,i) => {
          const isTarget = matchTarget?.id===p.id;
          return (
            <div key={p.id} ref={el=>tileRefs.current[p.id]=el} onClick={()=>setOpenedPerson(p)} style={{ borderRadius:20, overflow:"hidden", cursor:"pointer", background:C.surface, border:`1.5px solid ${isTarget?C.accent:C.border}`, boxShadow:isTarget?`0 0 18px ${C.accentGlow}`:"0 4px 16px rgba(0,0,0,0.2)", animation:`tilefloat ${3.2+(i%4)*0.6}s ease-in-out ${(i*0.35)%2}s infinite`, transition:"border-color 0.3s,box-shadow 0.3s" }}>
              <div style={{ height:88, background:p.gradient, position:"relative", overflow:"hidden" }}>
                <img src={personPhoto(p.id)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.style.display="none";}}/>
                {isTarget&&<div style={{ position:"absolute", inset:0, border:`2px solid ${C.accent}`, borderRadius:18, animation:"targetPulse 1s ease-in-out infinite" }}/>}
              </div>
              <div style={{ padding:"8px 9px 10px" }}>
                <div style={{ fontFamily:DM, fontSize:12, fontWeight:700, color:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.alias}</div>
                <div style={{ fontSize:10, color:C.textSub, lineHeight:1.4, marginTop:3, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{p.vibe}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )}

  {/* Reed character — only on discoverable */}
  {!isPrivate && (
    <div ref={reedRef} onMouseDown={onReedDown} onTouchStart={onReedDown} style={{ position:"absolute", left:reedPos.x, top:reedPos.y, zIndex:40, cursor:dragging?"grabbing":"grab", userSelect:"none", touchAction:"none" }}>
      {reedBubble&&(
        <div style={{ position:"absolute", bottom:"100%", left:"50%", transform:"translateX(-50%)", marginBottom:8, background:reedBubble.type==="match"?C.accent:C.surfaceUp, borderRadius:14, padding:"9px 13px", fontSize:12, color:"#fff", maxWidth:200, whiteSpace:"normal", lineHeight:1.45, boxShadow:"0 4px 16px rgba(0,0,0,0.3)", animation:"bubbleIn 0.25s ease-out", fontFamily:DM }}>
          {reedBubble.text}
          {reedBubble.type==="match"&&reedBubble.person&&(
            <div style={{ display:"flex", gap:6, marginTop:8 }}>
              <button onClick={e=>{e.stopPropagation();setOpenedPerson(reedBubble.person);setReedBubble(null);}} style={{ flex:1, padding:"5px 8px", borderRadius:8, background:"rgba(255,255,255,0.25)", border:"none", color:"#fff", cursor:"pointer", fontSize:11, fontWeight:600, fontFamily:DM }}>see them →</button>
              <button onClick={e=>{e.stopPropagation();setReedBubble(null);setMatchTarget(null);setReedMood("sitting");}} style={{ padding:"5px 8px", borderRadius:8, background:"none", border:"1px solid rgba(255,255,255,0.3)", color:"rgba(255,255,255,0.7)", cursor:"pointer", fontSize:11, fontFamily:DM }}>nah</button>
            </div>
          )}
          <div style={{ position:"absolute", bottom:-6, left:"50%", transform:"translateX(-50%)", width:0, height:0, borderLeft:"6px solid transparent", borderRight:"6px solid transparent", borderTop:`6px solid ${reedBubble.type==="match"?C.accent:C.surfaceUp}` }}/>
        </div>
      )}
      <ReedCharacter mood={reedMood} size={52} flipped={reedFlipped}/>
    </div>
  )}
</div>
```

);
}

// ── Chats Screen ─────────────────────────────────────────────────────────────
function ChatsScreen({ chipAnimal }) {
const [subTab, setSubTab] = useState("people");
const [openChat, setOpenChat] = useState(null);
const [chatMsgs, setChatMsgs] = useState([]);
const [chatInput, setChatInput] = useState("");
const [myGroups, setMyGroups] = useState(MY_GROUPS);
const [suggestions, setSuggestions] = useState(SUGGESTED_GROUPS);
const [openGroup, setOpenGroup] = useState(null);
const [groupMsgs, setGroupMsgs] = useState([]);
const [groupInput, setGroupInput] = useState("");
const endRef = useRef(null);
const grpEndRef = useRef(null);
useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[chatMsgs]);
useEffect(()=>{ grpEndRef.current?.scrollIntoView({behavior:"smooth"}); },[groupMsgs]);

const openChatWith = (chat) => { setOpenChat(chat); setChatMsgs(chat.messages||[]); };
const sendMsg = () => { if(!chatInput.trim()) return; setChatMsgs(prev=>[...prev,{sender:"me",text:chatInput.trim()}]); setChatInput(""); };
const sendGroupMsg = () => { if(!groupInput.trim()) return; setGroupMsgs(prev=>[...prev,{sender:"me",text:groupInput.trim()}]); setGroupInput(""); };
const joinGroup = (g) => { setSuggestions(prev=>prev.filter(x=>x.id!==g.id)); setMyGroups(prev=>[...prev,{...g,unread:0,time:"now"}]); };

if(openChat) return (
<div style={{ flex:1, display:"flex", flexDirection:"column", background:C.bg }}>
<div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, background:C.surface }}>
<button onClick={()=>{setOpenChat(null);setChatMsgs([]);}} style={{ background:"none",border:"none",color:C.text,fontSize:20,cursor:"pointer" }}>←</button>
<div style={{ width:36,height:36,borderRadius:"50%",overflow:"hidden",background:openChat.gradient,flexShrink:0 }}>
<img src={personPhoto(openChat.personId,72)} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} onError={e=>{e.target.style.display="none";}}/>
</div>
<div>
<div style={{ fontWeight:600,color:C.text,fontFamily:DM }}>{openChat.alias||openChat.name}</div>
<div style={{ fontSize:11,color:C.accent,fontFamily:DM }}>● Active now</div>
</div>
<ReedAvatar size={26} animal={chipAnimal} style={{ marginLeft:"auto" }}/>
</div>
<div style={{ flex:1,overflowY:"auto",padding:"12px 16px" }}>
{chatMsgs.map((m,i)=>(
<div key={i} style={{ marginBottom:10 }}>
{m.sender==="reed-nudge"&&<div style={{ display:"flex",gap:8,alignItems:"flex-start",margin:"8px 0" }}><ReedAvatar size={22} animal={chipAnimal}/><div style={{ fontSize:12,color:C.accent,background:C.accentDim,padding:"8px 12px",borderRadius:12,border:`1px solid ${C.accentGlow}`,lineHeight:1.5,fontFamily:DM }}>{m.text}</div></div>}
{m.sender==="me"&&!m.type&&<div style={{ display:"flex",justifyContent:"flex-end" }}><div style={{ maxWidth:"75%",padding:"10px 14px",background:C.accent,borderRadius:"16px 16px 4px 16px",color:"#fff",fontSize:14,fontFamily:DM }}>{m.text}</div></div>}
{m.sender==="me"&&m.type==="voice"&&<div style={{ display:"flex",justifyContent:"flex-end" }}><VoiceNotePlayer duration={m.duration} isMe={true}/></div>}
{m.sender==="me"&&m.type==="photo"&&<div style={{ display:"flex",justifyContent:"flex-end" }}><img src={m.url} style={{ maxWidth:180,borderRadius:14 }} alt=""/></div>}
{m.sender==="them"&&<div style={{ display:"flex",gap:8,alignItems:"flex-end" }}>
<div style={{ width:28,height:28,borderRadius:"50%",overflow:"hidden",background:openChat.gradient,flexShrink:0 }}><img src={personPhoto(openChat.personId,56)} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} onError={e=>{e.target.style.display="none";}}/></div>
<div style={{ maxWidth:"75%",padding:"10px 14px",background:C.surface,borderRadius:"16px 16px 16px 4px",color:C.text,fontSize:14,border:`1px solid ${C.border}`,fontFamily:DM }}>{m.text}</div>
</div>}
</div>
))}
<div ref={endRef}/>
</div>
<ChatInputBar placeholder={`Message ${openChat.alias||openChat.name}...`} value={chatInput} onChange={e=>setChatInput(e.target.value)} onSend={sendMsg} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}}} onVoiceSend={dur=>setChatMsgs(prev=>[...prev,{sender:"me",type:"voice",duration:dur}])} onPhotoSend={url=>setChatMsgs(prev=>[...prev,{sender:"me",type:"photo",url}])}/>
</div>
);

if(openGroup) return (
<div style={{ flex:1, display:"flex", flexDirection:"column", background:C.bg }}>
<div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, background:C.surface }}>
<button onClick={()=>{setOpenGroup(null);setGroupMsgs([]);}} style={{ background:"none",border:"none",color:C.text,fontSize:20,cursor:"pointer" }}>←</button>
<div style={{ width:36,height:36,borderRadius:"50%",background:openGroup.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>{openGroup.emoji}</div>
<div><div style={{ fontWeight:600,color:C.text,fontFamily:DM }}>{openGroup.name}</div><div style={{ fontSize:11,color:C.textDim,fontFamily:DM }}>{openGroup.memberCount} members</div></div>
</div>
<div style={{ flex:1,overflowY:"auto",padding:"12px 16px" }}>
<div style={{ textAlign:"center",fontSize:11,color:C.textDim,margin:"4px 0 14px",fontFamily:DM }}>Today</div>
<div style={{ display:"flex",gap:8,alignItems:"flex-end",marginBottom:10 }}><div style={{ width:28,height:28,borderRadius:"50%",background:openGroup.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>{openGroup.emoji}</div><div style={{ maxWidth:"75%",padding:"10px 14px",background:C.surface,borderRadius:"16px 16px 16px 4px",color:C.text,fontSize:14,border:`1px solid ${C.border}`,fontFamily:DM }}>{openGroup.lastMsg}</div></div>
{groupMsgs.map((m,i)=><div key={i} style={{ marginBottom:8 }}>{m.sender==="me"?<div style={{ display:"flex",justifyContent:"flex-end" }}><div style={{ maxWidth:"75%",padding:"10px 14px",background:C.accent,borderRadius:"16px 16px 4px 16px",color:"#fff",fontSize:14,fontFamily:DM }}>{m.text}</div></div>:<div style={{ display:"flex",gap:8,alignItems:"flex-end" }}><div style={{ width:28,height:28,borderRadius:"50%",background:openGroup.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>{openGroup.emoji}</div><div style={{ maxWidth:"75%",padding:"10px 14px",background:C.surface,borderRadius:"16px 16px 16px 4px",color:C.text,fontSize:14,border:`1px solid ${C.border}`,fontFamily:DM }}>{m.text}</div></div>}</div>)}
<div ref={grpEndRef}/>
</div>
<div style={{ padding:"10px 16px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8 }}>
<textarea value={groupInput} onChange={e=>setGroupInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendGroupMsg();}}} placeholder="Message the group..." rows={1} style={{ flex:1,padding:"11px 14px",borderRadius:22,border:`1px solid ${C.border}`,background:C.surface,color:C.text,resize:"none",fontFamily:DM,fontSize:14,outline:"none" }}/>
<button onClick={sendGroupMsg} disabled={!groupInput.trim()} style={{ width:42,height:42,borderRadius:"50%",background:groupInput.trim()?C.accent:"rgba(255,255,255,0.1)",border:"none",cursor:"pointer",color:"#fff",fontSize:18 }}>↑</button>
</div>
</div>
);

const totalUnread = MOCK_CHATS.reduce((a,c)=>a+(c.unread||0),0);
const groupUnread = myGroups.reduce((a,g)=>a+(g.unread||0),0);

return (
<div style={{ flex:1,display:"flex",flexDirection:"column",background:C.bg,overflow:"hidden" }}>
<div style={{ padding:"18px 20px 12px",borderBottom:`1px solid ${C.border}` }}>
<div style={{ fontFamily:DM,fontSize:22,fontWeight:700,color:C.text }}>Chats</div>
</div>
<div style={{ display:"flex",borderBottom:`1px solid ${C.border}`,background:C.surface }}>
{[{id:"people",label:"People",count:totalUnread},{id:"groups",label:"Groups",count:groupUnread}].map(t=>(
<button key={t.id} onClick={()=>setSubTab(t.id)} style={{ flex:1,padding:"12px 0",background:"none",border:"none",borderBottom:`2px solid ${subTab===t.id?C.accent:"transparent"}`,color:subTab===t.id?C.accent:C.textDim,cursor:"pointer",fontFamily:DM,fontSize:14,fontWeight:subTab===t.id?600:400,display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
{t.label}{t.count>0&&<span style={{ minWidth:16,height:16,borderRadius:8,padding:"0 4px",background:C.accent,color:"#fff",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700 }}>{t.count}</span>}
</button>
))}
</div>
<div style={{ flex:1,overflowY:"auto" }}>
{subTab==="people"&&MOCK_CHATS.map(chat=>(
<div key={chat.id} onClick={()=>openChatWith(chat)} style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:`1px solid ${C.border}`,cursor:"pointer" }}>
<div style={{ width:48,height:48,borderRadius:"50%",overflow:"hidden",background:chat.gradient }}>
<img src={personPhoto(chat.personId,96)} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} onError={e=>{e.target.style.display="none";}}/>
</div>
<div style={{ flex:1,minWidth:0 }}>
<div style={{ fontWeight:600,color:C.text,fontFamily:DM }}>{chat.alias||chat.name}</div>
<div style={{ fontSize:13,color:C.textDim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:DM }}>{chat.messages[chat.messages.length-1]?.text}</div>
</div>
<div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6 }}>
<div style={{ fontSize:11,color:C.textDim,fontFamily:DM }}>{chat.time}</div>
{chat.unread>0&&<div style={{ width:20,height:20,borderRadius:"50%",background:C.accent,color:"#fff",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700 }}>{chat.unread}</div>}
</div>
</div>
))}
{subTab==="groups"&&(
<div style={{ padding:"0 0 20px" }}>
{myGroups.length>0&&<>
<div style={{ padding:"12px 16px 4px",fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:0.5,fontFamily:DM }}>My groups</div>
{myGroups.map(g=>(
<div key={g.id} onClick={()=>setOpenGroup(g)} style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:`1px solid ${C.border}`,cursor:"pointer" }}>
<div style={{ width:48,height:48,borderRadius:"50%",background:g.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>{g.emoji}</div>
<div style={{ flex:1,minWidth:0 }}><div style={{ fontWeight:600,color:C.text,fontFamily:DM }}>{g.name}</div><div style={{ fontSize:13,color:C.textDim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:DM }}>{g.lastMsg}</div></div>
<div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6 }}><div style={{ fontSize:11,color:C.textDim,fontFamily:DM }}>{g.time}</div>{g.unread>0&&<div style={{ width:20,height:20,borderRadius:"50%",background:C.accent,color:"#fff",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700 }}>{g.unread}</div>}</div>
</div>
))}
</>}
{suggestions.length>0&&<>
<div style={{ padding:"16px 16px 8px",fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:0.5,fontFamily:DM }}>Reed suggests</div>
{suggestions.map(g=>(
<div key={g.id} style={{ margin:"0 16px 12px",borderRadius:18,border:`1px solid ${C.border}`,overflow:"hidden",background:C.surface }}>
<div style={{ height:4,background:g.gradient }}/>
<div style={{ padding:"14px" }}>
<div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
<div style={{ width:40,height:40,borderRadius:"50%",background:g.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>{g.emoji}</div>
<div><div style={{ fontWeight:600,color:C.text,fontSize:14,fontFamily:DM }}>{g.name}</div><div style={{ fontSize:11,color:C.textDim,fontFamily:DM }}>{g.memberCount} members</div></div>
</div>
<div style={{ fontSize:12,color:C.accent,fontStyle:"italic",marginBottom:8,fontFamily:DM }}>{g.reedReason}</div>
<div style={{ fontSize:12,color:C.textDim,marginBottom:12,fontFamily:DM }}>💬 {g.lastMsg}</div>
<div style={{ display:"flex",gap:8 }}>
<button onClick={()=>joinGroup(g)} style={{ flex:1,padding:"9px",borderRadius:12,background:C.accent,border:"none",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:DM }}>Join group →</button>
<button onClick={()=>setSuggestions(prev=>prev.filter(x=>x.id!==g.id))} style={{ padding:"9px 14px",borderRadius:12,background:"none",border:`1px solid ${C.border}`,color:C.textDim,cursor:"pointer",fontSize:13,fontFamily:DM }}>Pass</button>
</div>
</div>
</div>
))}
</>}
</div>
)}
</div>
</div>
);
}

// ── Plans Screen ──────────────────────────────────────────────────────────────
function PlansScreen({ userProfile, chipAnimal }) {
const [category, setCategory] = useState("all");
const [events, setEvents] = useState(EVENTS);
const [weeklyDigest, setWeeklyDigest] = useState(null);
const [digestLoading, setDigestLoading] = useState(true);
const [showDigest, setShowDigest] = useState(true);
useEffect(()=>{
(async()=>{
try { const text=await callAI(`You are Reed on Chins. Write a warm 2-sentence weekly digest. Mention 1 specific event and 1 person. User: ${JSON.stringify(userProfile||{name:"you"})}. Events: ${JSON.stringify(EVENTS.slice(0,3).map(e=>({title:e.title,date:e.date})))}`,null,120); setWeeklyDigest(text); }
catch { setWeeklyDigest("There’s a board game night Friday and a parkrun Saturday — both worth showing up to."); }
setDigestLoading(false);
})();
},[]);
const filtered = category==="all"?events:events.filter(e=>e.time===category);
const toggleGoing = (id) => setEvents(prev=>prev.map(e=>e.id===id?{...e,going:!e.going}:e));
return (
<div style={{ flex:1, display:"flex", flexDirection:"column", background:C.bg, overflow:"hidden" }}>
<div style={{ padding:"18px 20px 12px", borderBottom:`1px solid ${C.border}` }}>
<div style={{ fontFamily:DM, fontSize:22, fontWeight:700, color:C.text }}>Plans</div>
<div style={{ fontSize:11, color:C.accent, marginTop:2, fontFamily:DM }}>Things to do — and who you’d meet</div>
</div>
<div style={{ flex:1, overflowY:"auto" }}>
{showDigest&&<div style={{ margin:"12px 16px 0", padding:"14px", background:C.accentDim, borderRadius:16, border:`1px solid ${C.accentGlow}`, display:"flex", gap:10, alignItems:"flex-start" }}>
<ReedAvatar size={28} animal={chipAnimal}/>
<div style={{ flex:1 }}>
<div style={{ fontSize:10, fontWeight:600, color:C.accent, textTransform:"uppercase", letterSpacing:0.5, fontFamily:DM }}>Reed’s pick this week</div>
{digestLoading?<Dots/>:<><div style={{ fontSize:13, color:C.text, marginTop:4, lineHeight:1.6, fontFamily:DM }}>{weeklyDigest}</div><button onClick={()=>setShowDigest(false)} style={{ marginTop:8, background:"none", border:"none", color:C.accent, cursor:"pointer", fontSize:12, fontFamily:DM }}>Dismiss</button></>}
</div>
</div>}
<div style={{ display:"flex", gap:8, padding:"12px 16px", overflowX:"auto", scrollbarWidth:"none" }}>
{EVENT_CATEGORIES.map(c=><button key={c.id} onClick={()=>setCategory(c.id)} style={{ padding:"7px 14px", borderRadius:20, border:`1.5px solid ${category===c.id?C.accent:C.border}`, background:category===c.id?C.accentDim:"none", color:category===c.id?C.accent:C.textSub, cursor:"pointer", fontFamily:DM, fontSize:13, whiteSpace:"nowrap", fontWeight:category===c.id?600:400 }}>{c.emoji} {c.label}</button>)}
</div>
<div style={{ padding:"0 16px 20px" }}>
{filtered.map(event=>(
<div key={event.id} style={{ marginBottom:14, background:"rgba(255,255,255,0.09)", borderRadius:20, border:`1px solid ${C.border}`, overflow:"hidden" }}>
{event.who?.length>0&&<div style={{ padding:"16px 16px 0", display:"flex", alignItems:"center", gap:12 }}>
<div style={{ width:44, height:44, borderRadius:"50%", background:event.who[0].gradient, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontFamily:DM }}>{event.who[0].initials}</div>
<div><div style={{ fontFamily:DM, fontSize:14, fontWeight:500, color:C.text }}>{event.who[0].name}</div><div style={{ fontSize:11, color:C.textSub, fontFamily:DM }}>will be there</div></div>
<div style={{ marginLeft:"auto", textAlign:"right" }}><div style={{ fontSize:11, fontWeight:600, color:C.text, fontFamily:DM }}>{event.date}</div><div style={{ fontSize:10, color:C.textSub, fontFamily:DM }}>{event.clock}</div></div>
</div>}
{event.reedNote&&<div style={{ margin:"12px 16px 0", padding:"10px 12px", background:C.accentDim, borderRadius:12, display:"flex", gap:8, alignItems:"flex-start" }}><ReedAvatar size={18} animal={chipAnimal}/><div style={{ fontSize:12, color:C.accent, lineHeight:1.55, fontStyle:"italic", flex:1, fontFamily:DM }}>{event.reedNote}</div></div>}
<div style={{ margin:"12px 16px 0", padding:"10px 12px", background:"rgba(255,255,255,0.06)", borderRadius:12, display:"flex", alignItems:"center", gap:10 }}>
<span style={{ fontSize:22 }}>{event.emoji}</span>
<div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600, color:C.text, fontFamily:DM }}>{event.title}</div><div style={{ fontSize:11, color:C.textSub, marginTop:1, fontFamily:DM }}>📍 {event.location}</div></div>
<div style={{ display:"flex", gap:4 }}>{event.tags.slice(0,2).map(t=><span key={t} style={{ padding:"2px 8px", borderRadius:8, background:C.border, color:C.textSub, fontSize:10, fontFamily:DM }}>{t}</span>)}</div>
</div>
<div style={{ padding:"12px 16px 16px" }}>
<button onClick={()=>toggleGoing(event.id)} style={{ width:"100%", padding:"11px", borderRadius:14, border:`1.5px solid ${event.going?C.accent:C.border}`, background:event.going?C.accentDim:"none", color:event.going?C.accent:C.text, cursor:"pointer", fontWeight:600, fontSize:14, fontFamily:DM }}>{event.going?"✓ I’m going":"count me in →"}</button>
</div>
</div>
))}
</div>
</div>
</div>
);
}

// ── Mingle Screen ─────────────────────────────────────────────────────────────
function MingleScreen({ userProfile, chipAnimal }) {
const [match, setMatch] = useState(null);
const [loading, setLoading] = useState(false);
const [passed, setPassed] = useState([]);
const findMatch = async () => {
setLoading(true); setMatch(null);
try {
const raw=await callAI(`You are Reed. Pick someone genuinely outside the user's usual world. User: ${JSON.stringify(userProfile||{name:"you"})}. People: ${JSON.stringify(NEARBY.map(p=>({id:p.id,alias:p.alias,vibe:p.vibe,interests:p.interests})))}. Already passed: ${JSON.stringify(passed)}. Reply ONLY in JSON: {"matchId":<number>,"why":"<one sentence>","opener":"<warm first message>"}`,null,180);
const json=JSON.parse(raw.replace(/`json|`/g,"").trim());
const person=NEARBY.find(p=>p.id===json.matchId)||NEARBY.find(p=>!passed.includes(p.id))||NEARBY[0];
setMatch({person,why:json.why,opener:json.opener});
} catch {
const p=NEARBY.filter(x=>!passed.includes(x.id))[0]||NEARBY[0];
setMatch({person:p,why:`${p.alias}'s world is genuinely different from yours — that's the point.`,opener:`Hey ${p.alias} — Reed thinks we'd have an interesting conversation.`});
}
setLoading(false);
};
useEffect(()=>{ findMatch(); },[]);
return (
<div style={{ flex:1, display:"flex", flexDirection:"column", background:C.bg, overflow:"hidden" }}>
<div style={{ padding:"18px 20px 12px", borderBottom:`1px solid ${C.border}` }}>
<div style={{ fontFamily:DM, fontSize:22, fontWeight:700, color:C.text }}>Mingle</div>
<div style={{ fontSize:11, color:C.accent, marginTop:2, fontFamily:DM }}>Someone outside your usual world</div>
</div>
<div style={{ flex:1, overflowY:"auto", padding:"20px 16px" }}>
<div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:20 }}>
<ReedAvatar size={36} animal={chipAnimal}/>
<div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"12px 14px", fontSize:14, color:C.text, lineHeight:1.6, fontFamily:DM }}>
Not your usual crowd. Someone genuinely different — Reed thinks you’d surprise each other.
</div>
</div>
{loading&&<div style={{ padding:"24px", background:C.surface, borderRadius:24, border:`1px solid ${C.border}`, display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}><Dots/><div style={{ fontSize:12, color:C.textSub, fontFamily:DM }}>Reed is thinking outside the box...</div></div>}
{match&&!loading&&(
<div style={{ background:"rgba(255,255,255,0.09)", borderRadius:24, border:`1px solid ${C.border}`, overflow:"hidden" }}>
<div style={{ height:140, background:match.person.gradient, position:"relative", display:"flex", alignItems:"flex-end", padding:"0 20px 20px" }}>
<div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))" }}/>
<div style={{ position:"relative", zIndex:1 }}>
<div style={{ fontFamily:DM, fontSize:24, fontWeight:700, color:"#fff" }}>{match.person.alias}</div>
</div>
</div>
<div style={{ padding:"16px 20px 20px", display:"flex", flexDirection:"column", gap:12 }}>
<div style={{ background:C.accentDim, borderRadius:14, padding:"10px 14px", display:"flex", gap:8, alignItems:"flex-start" }}>
<ReedAvatar size={20} animal={chipAnimal}/>
<div style={{ fontSize:12, color:C.accent, lineHeight:1.6, fontStyle:"italic", flex:1, fontFamily:DM }}>{match.why}</div>
</div>
<div style={{ background:"rgba(255,255,255,0.06)", borderRadius:14, padding:"10px 14px", border:`1px solid ${C.border}` }}>
<div style={{ fontSize:10, fontWeight:600, color:C.textDim, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4, fontFamily:DM }}>Reed’s opener</div>
<div style={{ fontSize:12, color:C.text, fontStyle:"italic", fontFamily:DM }}>"{match.opener}"</div>
</div>
<div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{match.person.interests.slice(0,4).map(i=><span key={i} style={{ padding:"4px 10px", borderRadius:20, background:C.surface, border:`1px solid ${C.border}`, color:C.textSub, fontSize:12, fontFamily:DM }}>{i}</span>)}</div>
<div style={{ display:"flex", gap:8, marginTop:4 }}>
<button onClick={()=>{ if(match) setPassed(prev=>[...prev,match.person.id]); findMatch(); }} style={{ flex:1, padding:"12px", borderRadius:16, border:`1px solid ${C.border}`, background:"none", color:C.text, cursor:"pointer", fontSize:14, fontFamily:DM }}>Pass</button>
<button style={{ flex:2, padding:"12px", borderRadius:16, border:"none", background:C.accent, color:"#fff", cursor:"pointer", fontWeight:600, fontSize:14, fontFamily:DM }}>Say hello →</button>
</div>
</div>
</div>
)}
</div>
</div>
);
}

// ── Settings Screen ───────────────────────────────────────────────────────────
function SettingsScreen({ onBack, onLogout, onDeleteAccount }) {
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [notifications, setNotifications] = useState(true);
const [emailUpdates, setEmailUpdates] = useState(false);
const [showReedConvo, setShowReedConvo] = useState(true);

const Toggle = ({ value, onChange }) => (
<div onClick={()=>onChange(!value)} style={{ width:44, height:26, borderRadius:13, background:value?C.accent:"rgba(255,255,255,0.15)", cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
<div style={{ position:"absolute", top:3, left:value?21:3, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.3)" }}/>
</div>
);

const Row = ({ icon, label, sublabel, danger, onPress, right }) => (
<div onClick={onPress} style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 20px", borderBottom:`1px solid ${C.border}`, cursor:onPress?"pointer":"default" }}>
<div style={{ fontSize:20, width:28, textAlign:"center" }}>{icon}</div>
<div style={{ flex:1 }}>
<div style={{ fontFamily:DM, fontSize:15, color:danger?"#E05252":C.text, fontWeight:500 }}>{label}</div>
{sublabel&&<div style={{ fontFamily:DM, fontSize:12, color:C.textDim, marginTop:2 }}>{sublabel}</div>}
</div>
{right||( onPress&&!danger&&<div style={{ color:C.textDim, fontSize:16 }}>›</div> )}
</div>
);

if (showDeleteConfirm) return (
<div style={{ flex:1, display:"flex", flexDirection:"column", background:C.bg }}>
<div style={{ padding:"20px 20px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12 }}>
<button onClick={()=>setShowDeleteConfirm(false)} style={{ background:"none", border:"none", color:C.text, fontSize:20, cursor:"pointer" }}>←</button>
<div style={{ fontFamily:DM, fontSize:18, fontWeight:700, color:"#E05252" }}>Delete account</div>
</div>
<div style={{ flex:1, padding:"32px 24px" }}>
<div style={{ fontSize:48, textAlign:"center", marginBottom:20 }}>⚠️</div>
<div style={{ fontFamily:DM, fontSize:17, fontWeight:700, color:C.text, textAlign:"center", marginBottom:12 }}>Are you absolutely sure?</div>
<div style={{ fontFamily:DM, fontSize:14, color:C.textSub, textAlign:"center", lineHeight:1.7, marginBottom:32 }}>
This will permanently delete your account, your profile, all your conversations, and your connections. This cannot be undone.
</div>
<button onClick={onDeleteAccount} style={{ width:"100%", padding:"16px", borderRadius:16, border:"none", background:"#E05252", color:"#fff", fontFamily:DM, fontSize:16, fontWeight:700, cursor:"pointer", marginBottom:12 }}>
Yes, delete my account
</button>
<button onClick={()=>setShowDeleteConfirm(false)} style={{ width:"100%", padding:"16px", borderRadius:16, border:`1px solid ${C.border}`, background:"none", color:C.text, fontFamily:DM, fontSize:16, cursor:"pointer" }}>
Cancel
</button>
</div>
</div>
);

return (
<div style={{ flex:1, display:"flex", flexDirection:"column", background:C.bg, overflow:"hidden" }}>
<div style={{ padding:"20px 20px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
<button onClick={onBack} style={{ background:"none", border:"none", color:C.text, fontSize:20, cursor:"pointer" }}>←</button>
<div style={{ fontFamily:DM, fontSize:18, fontWeight:700, color:C.text }}>Settings</div>
</div>
<div style={{ flex:1, overflowY:"auto" }}>

```
    {/* Notifications */}
    <div style={{ padding:"12px 20px 6px", fontSize:11, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:1, fontFamily:DM }}>Notifications</div>
    <Row icon="🔔" label="Push notifications" sublabel="Match alerts and messages" right={<Toggle value={notifications} onChange={setNotifications}/>}/>
    <Row icon="📧" label="Email updates" sublabel="Weekly digest from Reed" right={<Toggle value={emailUpdates} onChange={setEmailUpdates}/>}/>

    {/* Privacy */}
    <div style={{ padding:"20px 20px 6px", fontSize:11, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:1, fontFamily:DM }}>Privacy</div>
    <Row icon="💬" label="Show Reed conversation" sublabel="Visible to your matches" right={<Toggle value={showReedConvo} onChange={setShowReedConvo}/>}/>
    <Row icon="📋" label="Download my data" sublabel="Get a copy of everything Chins holds" onPress={()=>alert("We'll email your data within 48 hours.")}/>

    {/* Support */}
    <div style={{ padding:"20px 20px 6px", fontSize:11, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:1, fontFamily:DM }}>Support</div>
    <Row icon="❓" label="Help & FAQ" onPress={()=>{}}/>
    <Row icon="🐛" label="Report a bug" onPress={()=>{}}/>
    <Row icon="⭐" label="Rate Chins" onPress={()=>{}}/>

    {/* Legal */}
    <div style={{ padding:"20px 20px 6px", fontSize:11, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:1, fontFamily:DM }}>Legal</div>
    <Row icon="🔒" label="Privacy policy" onPress={()=>{}}/>
    <Row icon="📄" label="Terms of service" onPress={()=>{}}/>

    {/* Account */}
    <div style={{ padding:"20px 20px 6px", fontSize:11, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:1, fontFamily:DM }}>Account</div>
    <Row icon="🚪" label="Log out" onPress={onLogout}/>
    <Row icon="🗑️" label="Delete account" sublabel="Permanently remove your account and data" danger={true} onPress={()=>setShowDeleteConfirm(true)}/>

    <div style={{ padding:"24px 20px", textAlign:"center" }}>
      <div style={{ fontFamily:DM, fontSize:12, color:C.textDim }}>Chins v1.0</div>
      <div style={{ fontFamily:DM, fontSize:11, color:"rgba(255,255,255,0.2)", marginTop:4 }}>Made with care 💚</div>
    </div>
  </div>
</div>
```

);
}

// ── Profile Screen ────────────────────────────────────────────────────────────
function ProfileScreen({ profile, privacyMode, onPrivacyChange, userPhoto, onPhotoUpload, onLogout, onDeleteAccount }) {
const p = profile || { name:"You", vibe:"Still getting to know you...", interests:[], lookingFor:"", emoji:"🧍" };
const photoRef = useRef(null);
const [showSettings, setShowSettings] = useState(false);

if (showSettings) return (
<SettingsScreen
onBack={()=>setShowSettings(false)}
onLogout={onLogout}
onDeleteAccount={onDeleteAccount}
/>
);

return (
<div style={{ flex:1,overflowY:"auto",background:C.bg }}>
<div style={{ padding:"20px 20px 12px",borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
<div style={{ fontFamily:DM,fontSize:22,fontWeight:700,color:C.text }}>Profile</div>
<button onClick={()=>setShowSettings(true)} style={{ background:"none", border:"none", cursor:"pointer", padding:"4px", display:"flex", alignItems:"center", justifyContent:"center" }}>
<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
<path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none"/>
<path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
</svg>
</button>
</div>
<div style={{ padding:"24px 20px" }}>
<div style={{ display:"flex",gap:16,alignItems:"center",marginBottom:24 }}>
<div style={{ position:"relative" }}>
<input ref={photoRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{const f=e.target.files[0];if(f)onPhotoUpload(URL.createObjectURL(f));e.target.value="";}}/>
<div onClick={()=>photoRef.current?.click()} style={{ width:72,height:72,borderRadius:"50%",overflow:"hidden",background:"linear-gradient(135deg,#4BC1A0,#2d8f70)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,cursor:"pointer" }}>
{userPhoto?<img src={userPhoto} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>:(p.emoji||"🧍")}
</div>
<div style={{ position:"absolute",bottom:0,right:0,width:22,height:22,borderRadius:"50%",background:C.accent,border:"2px solid #054a43",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,cursor:"pointer" }} onClick={()=>photoRef.current?.click()}>+</div>
</div>
<div style={{ flex:1 }}>
<div style={{ fontFamily:DM,fontSize:20,fontWeight:700,color:C.text }}>{p.name||"You"}</div>
{p.alias&&<div style={{ fontSize:13,color:C.accent,fontFamily:DM,marginTop:2 }}>@{p.alias}</div>}
<div style={{ fontSize:13,color:C.textSub,fontFamily:DM,marginTop:4,fontStyle:"italic" }}>"{p.vibe}"</div>
</div>
</div>

```
    {/* Privacy toggle */}
    <div style={{ marginBottom:24,padding:"16px",background:C.surface,borderRadius:18,border:`1px solid ${C.border}` }}>
      <div style={{ fontFamily:DM,fontSize:13,fontWeight:700,color:C.text,marginBottom:12 }}>Privacy mode</div>
      <div style={{ display:"flex",gap:8 }}>
        {["private","discoverable"].map(mode=>(
          <button key={mode} onClick={()=>onPrivacyChange(mode)} style={{ flex:1,padding:"10px",borderRadius:12,border:`1.5px solid ${privacyMode===mode?C.accent:C.border}`,background:privacyMode===mode?C.accentDim:"none",color:privacyMode===mode?C.accent:C.textDim,fontFamily:DM,fontSize:13,fontWeight:privacyMode===mode?700:400,cursor:"pointer",transition:"all 0.2s" }}>
            {mode==="private"?"🔒 Private":"🌍 Discoverable"}
          </button>
        ))}
      </div>
      <div style={{ fontSize:12,color:C.textDim,marginTop:10,fontFamily:DM,lineHeight:1.6 }}>
        {privacyMode==="private"?"You're invisible. Reed makes all introductions on your behalf.":"Your alias and interests are visible. Reed still makes introductions."}
      </div>
    </div>

    {p.interests?.length>0&&(
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:10,fontFamily:DM }}>Interests</div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
          {p.interests.map(i=><span key={i} style={{ padding:"6px 14px",borderRadius:20,background:C.accentDim,border:`1px solid ${C.accentGlow}`,color:C.accent,fontSize:13,fontFamily:DM }}>{i}</span>)}
        </div>
      </div>
    )}

    <div style={{ padding:"14px 16px",background:C.accentDim,borderRadius:16,border:`1px solid ${C.accentGlow}` }}>
      <div style={{ display:"flex",gap:10,alignItems:"flex-start" }}>
        <ReedCharacter mood="idle" size={24}/>
        <div style={{ fontSize:13,color:C.accent,lineHeight:1.6,fontStyle:"italic",fontFamily:DM }}>
          "The more I know you, the better your matches get. Keep talking to me."
        </div>
      </div>
    </div>
  </div>
</div>
```

);
}

// ── Global Styles ─────────────────────────────────────────────────────────────
const globalStyles = `
@import url(‘https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap’);

- { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #021a16; }
  @keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
  @keyframes tilefloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-7px)} }
  @keyframes reedBob { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-5px)} }
  @keyframes reedBounce { 0%{transform:translateY(0px)} 100%{transform:translateY(-10px)} }
  @keyframes reedRun { 0%{transform:rotate(-8deg) translateY(0)} 100%{transform:rotate(8deg) translateY(-4px)} }
  @keyframes bubbleIn { from{opacity:0;transform:translateX(-50%) scale(0.85)} to{opacity:1;transform:translateX(-50%) scale(1)} }
  @keyframes targetPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
  @keyframes float3 { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-8px)} }
  @keyframes float4 { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-12px)} }
  @keyframes float5 { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-6px)} }
  @keyframes drift0 { 0%{transform:translate(-50%,-50%) translate(0,0)} 25%{transform:translate(-50%,-50%) translate(18px,-22px)} 50%{transform:translate(-50%,-50%) translate(-10px,-38px)} 75%{transform:translate(-50%,-50%) translate(-28px,-14px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }
  @keyframes drift1 { 0%{transform:translate(-50%,-50%) translate(0,0)} 30%{transform:translate(-50%,-50%) translate(-22px,16px)} 60%{transform:translate(-50%,-50%) translate(14px,30px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }
  @keyframes drift2 { 0%{transform:translate(-50%,-50%) translate(0,0)} 20%{transform:translate(-50%,-50%) translate(28px,12px)} 55%{transform:translate(-50%,-50%) translate(8px,-24px)} 80%{transform:translate(-50%,-50%) translate(-18px,-8px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }
  @keyframes drift3 { 0%{transform:translate(-50%,-50%) translate(0,0)} 35%{transform:translate(-50%,-50%) translate(20px,-18px)} 70%{transform:translate(-50%,-50%) translate(-12px,-30px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }
  @keyframes drift4 { 0%{transform:translate(-50%,-50%) translate(0,0)} 25%{transform:translate(-50%,-50%) translate(-24px,-20px)} 50%{transform:translate(-50%,-50%) translate(-36px,10px)} 75%{transform:translate(-50%,-50%) translate(-16px,26px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }
  @keyframes drift5 { 0%{transform:translate(-50%,-50%) translate(0,0)} 40%{transform:translate(-50%,-50%) translate(22px,20px)} 70%{transform:translate(-50%,-50%) translate(10px,-16px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }
  @keyframes drift6 { 0%{transform:translate(-50%,-50%) translate(0,0)} 30%{transform:translate(-50%,-50%) translate(-18px,24px)} 65%{transform:translate(-50%,-50%) translate(16px,32px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }
  @keyframes drift7 { 0%{transform:translate(-50%,-50%) translate(0,0)} 20%{transform:translate(-50%,-50%) translate(26px,-14px)} 50%{transform:translate(-50%,-50%) translate(38px,8px)} 80%{transform:translate(-50%,-50%) translate(12px,22px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }
  @keyframes drift8 { 0%{transform:translate(-50%,-50%) translate(0,0)} 45%{transform:translate(-50%,-50%) translate(-20px,-28px)} 75%{transform:translate(-50%,-50%) translate(10px,-18px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }
  ::-webkit-scrollbar { display: none; }
  input, textarea, button { font-family: ‘DM Sans’, sans-serif; }
  `;

// ── Tab Icons ─────────────────────────────────────────────────────────────────
function TabIcon({ id, active, color }) {
const c = active ? color : "rgba(255,255,255,0.38)";
const sw = 1.6;
const sc = { stroke:c, strokeWidth:sw, strokeLinecap:"round", strokeLinejoin:"round", fill:"none" };
switch(id) {
case "connect": return (
<svg width="24" height="22" viewBox="0 0 24 22" fill="none">
<ellipse cx="9" cy="7.5" rx="3.2" ry="3.2" fill={active?color:"rgba(255,255,255,0.38)"} opacity={active?0.55:0.6}/>
<path d="M3 20 C3 15.5 5.8 13 9 13 C10.1 13 11.1 13.3 12 13.9" stroke={c} strokeWidth={sw} strokeLinecap="round" fill="none" opacity={active?0.55:0.6}/>
<ellipse cx="15.5" cy="7" rx="3.4" ry="3.4" fill={c}/>
<path d="M9 21 C9 16.2 12 13.5 15.5 13.5 C19 13.5 22 16.2 22 21" {...sc} strokeWidth="1.8"/>
</svg>
);
case "chats": return (
<svg width="22" height="22" viewBox="0 0 22 22" fill="none">
<path d="M3 3.5 H19 A1.5 1.5 0 0 1 20.5 5 V13 A1.5 1.5 0 0 1 19 14.5 H10 L5.5 19 V14.5 H3 A1.5 1.5 0 0 1 1.5 13 V5 A1.5 1.5 0 0 1 3 3.5 Z" {...sc}/>
<line x1="6" y1="8.5" x2="16" y2="8.5" {...sc}/><line x1="6" y1="11.5" x2="12" y2="11.5" {...sc}/>
</svg>
);
case "plans": return (
<svg width="22" height="22" viewBox="0 0 22 22" fill="none">
{/* White/light body */}
<rect x="2" y="5" width="18" height="15" rx="3"
fill={active?"rgba(255,255,255,0.92)":"rgba(255,255,255,0.15)"}
stroke={active?"rgba(255,255,255,0.4)":c} strokeWidth="1.2"/>
{/* Coloured header — red like the calendar emoji */}
<path d="M2 8.5 H20 V5 Q20 2 17 2 H5 Q2 2 2 5 Z"
fill={active?"#E05252":"rgba(255,255,255,0.35)"}/>
{/* Binding rings */}
<line x1="7.5" y1="2" x2="7.5" y2="6.5" stroke={active?"#E05252":c} strokeWidth="2" strokeLinecap="round"/>
<line x1="14.5" y1="2" x2="14.5" y2="6.5" stroke={active?"#E05252":c} strokeWidth="2" strokeLinecap="round"/>
{/* Date grid dots — dark when active over white body */}
<circle cx="7"  cy="13" r="1.3" fill={active?"rgba(50,50,50,0.7)":c}/>
<circle cx="11" cy="13" r="1.3" fill={active?"rgba(50,50,50,0.7)":c}/>
<circle cx="15" cy="13" r="1.3" fill={active?"rgba(50,50,50,0.7)":c}/>
<circle cx="7"  cy="17" r="1.3" fill={active?"rgba(50,50,50,0.5)":c} opacity={active?1:0.5}/>
<circle cx="11" cy="17" r="1.3" fill={active?"#E05252":"rgba(255,255,255,0.4)"} opacity={active?1:0.5}/>
</svg>
);
case "mingle": return (
<svg width="22" height="22" viewBox="0 0 22 22" fill="none">
{/* Top arrow: left to right, curves down */}
<path d="M2 5 C2 5 8 5 11 11 C14 17 20 17 20 17" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/>
<path d="M17 14.5 L20.5 17 L17.5 19.5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
{/* Bottom arrow: left to right, curves up */}
<path d="M2 17 C2 17 8 17 11 11 C14 5 20 5 20 5" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/>
<path d="M17 2.5 L20.5 5 L17.5 7.5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
</svg>
);
case "reed": return (
<svg width="22" height="22" viewBox="0 0 22 22" fill="none">
<circle cx="11" cy="11" r="9" {...sc}/>
<circle cx="8" cy="9.5" r="1.1" fill={c}/><circle cx="14" cy="9.5" r="1.1" fill={c}/>
<path d="M7.5 13.5 Q11 16.5 14.5 13.5" {...sc}/>
</svg>
);
case "profile": return (
<svg width="22" height="22" viewBox="0 0 22 22" fill="none">
<circle cx="11" cy="7.5" r="3.5" {...sc}/>
<path d="M3.5 20 C3.5 15.5 6.8 12.5 11 12.5 C15.2 12.5 18.5 15.5 18.5 20" {...sc}/>
</svg>
);
default: return null;
}
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function ChinsApp() {
// Screen flow: splash → signup → privacy → safety → meet-reed → main
const [screen, setScreen] = useState("splash");
const [tab, setTab] = useState("connect");
const [profile, setProfile] = useState(null);
const [privacyMode, setPrivacyMode] = useState("discoverable");
const [msgs, setMsgs] = useState([]);
const [hist, setHist] = useState([]);
const [started, setStarted] = useState(false);
const [kicked, setKicked] = useState(false);
const [loading, setLoading] = useState(false);
const [input, setInput] = useState("");
const [profileInsertIdx, setProfileInsertIdx] = useState(null);
const [chipAnimal, setChipAnimal] = useState(null);
const [showAnimalToast, setShowAnimalToast] = useState(false);
const [connectionCount, setConnectionCount] = useState(0);
const [userPhoto, setUserPhoto] = useState(null);
const photoRef = useRef(null);

useEffect(()=>{ if(started&&!kicked){setKicked(true);kickoff();} },[started]);

const callReed = async (messages) => {
const r = await fetch(API, {
method:"POST",
headers:{ "Content-Type":"application/json", "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true", "x-api-key": API_KEY },
body:JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:800, system:REED_PROMPT, messages }),
});
const d = await r.json();
if(d.error) throw new Error(d.error.message);
return d.content?.find(b=>b.type==="text")?.text||"";
};

const kickoff = async () => {
setLoading(true);
try {
const text = await callReed([{role:"user",content:"start"}]);
setHist([{role:"user",content:"start"},{role:"assistant",content:text}]);
setMsgs([{role:"reed",text}]);
} catch {
const fb = "hey — I’m Reed. before we get into anything, quick question: if you had a completely free Saturday with no obligations, what would actually happen?";
setMsgs([{role:"reed",text:fb}]);
setHist([{role:"user",content:"start"},{role:"assistant",content:fb}]);
}
setLoading(false);
};

const processReply = (raw, histBase) => {
const clean = raw.replace(/<profile>[\s\S]*?</profile>/g,"").replace(/<animal>[\s\S]*?</animal>/g,"").trim();
setHist([...histBase,{role:"assistant",content:clean}]);
const pm = raw.match(/<profile>([\s\S]*?)</profile>/);
if(pm&&!profile){
try{
const parsed = JSON.parse(pm[1]);
setProfile(parsed);
setProfileInsertIdx(msgs.length+1);
// Reed wraps up, then transitions to main app
const signoff = "okay — I think I’ve got you. give me a moment and I’ll go find your people.";
setTimeout(()=>{
setMsgs(prev=>[...prev,{role:"reed",text:signoff}]);
}, 600);
setTimeout(()=>{ setScreen("main"); }, 3200);
}catch{}
}
const am = raw.match(/<animal>([\s\S]*?)</animal>/);
if(am&&!chipAnimal){ try{ const a=JSON.parse(am[1]); setChipAnimal(a); setShowAnimalToast(true); setTimeout(()=>setShowAnimalToast(false),8000); }catch{} }
setMsgs(prev=>[...prev,{role:"reed",text:clean}]);
};

const send = async (textOverride) => {
const txt = (textOverride||input).trim();
if(!txt||loading) return;
setInput("");
setMsgs(prev=>[...prev,{role:"user",text:txt}]);
const nH = [...hist,{role:"user",content:txt}];
setLoading(true);
try { const raw=await callReed(nH); processReply(raw,nH); }
catch(e){ setMsgs(prev=>[...prev,{role:"reed",text:`⚠️ ${e.message}`}]); }
setLoading(false);
};

const tabs = [
{ id:"connect", label:"Connect", color:"#4BC1A0" },
{ id:"chats",   label:"Chats",   color:"#66BB6A" },
{ id:"plans",   label:"Plans",   color:"#C9D1A5" },
{ id:"mingle",  label:"Mingle",  color:"#E1814C" },
{ id:"reed",    label:"Reed",    color:"#4BC1A0" },
{ id:"profile", label:"Profile", color:"#C9D1A5" },
];

return (
<>
<style>{globalStyles}</style>
<div style={{ position:"fixed", inset:0, display:"flex", justifyContent:"center", alignItems:"center", background:"#021a16", fontFamily:DM, overflow:"hidden" }}>
<div style={{ width:390, height:844, background:C.bg, borderRadius:44, overflow:"hidden", position:"relative", display:"flex", flexDirection:"column", boxShadow:"0 40px 80px rgba(0,0,0,0.6)" }}>

```
      {screen==="splash"&&<SplashScreen onSignup={()=>setScreen("signup")} onLogin={()=>setScreen("login")}/>}
      {screen==="login"&&<LoginScreen onComplete={()=>{ setScreen("main"); setTab("connect"); }} onBack={()=>setScreen("splash")}/>}
      {screen==="signup"&&<SignupScreen onComplete={()=>setScreen("privacy")} onBack={()=>setScreen("splash")}/>}
      {screen==="privacy"&&<PrivacyScreen onAccept={()=>setScreen("safety")}/>}
      {screen==="safety"&&<SafetyScreen onContinue={()=>setScreen("meet-reed")}/>}
      {screen==="meet-reed"&&<MeetReedScreen onComplete={(mode)=>{ setPrivacyMode(mode); setScreen("onboarding"); setStarted(true); }}/>}

      {screen==="onboarding"&&(
        <ReedChat
          msgs={msgs} loading={loading} input={input} setInput={setInput}
          send={send} profile={profile} progress={Math.min(profile?100:95,msgs.filter(m=>m.role==="user").length*12)}
          chipAnimal={chipAnimal} showAnimalToast={showAnimalToast} setShowAnimalToast={setShowAnimalToast}
          profileInsertIdx={profileInsertIdx} privacyMode={privacyMode}
        />
      )}

      {screen==="main"&&(
        <>
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" }}>
            {tab==="connect"&&<ConnectScreen userProfile={profile} connectionCount={connectionCount} onConnect={p=>setConnectionCount(c=>c+1)} privacyMode={privacyMode} onGoToReed={()=>setTab("reed")} chipAnimal={chipAnimal}/>}
            {tab==="chats"&&<ChatsScreen chipAnimal={chipAnimal}/>}
            {tab==="plans"&&<PlansScreen userProfile={profile} chipAnimal={chipAnimal}/>}
            {tab==="mingle"&&<MingleScreen userProfile={profile} chipAnimal={chipAnimal}/>}
            {tab==="reed"&&(
              <ReedChat
                msgs={msgs} loading={loading} input={input} setInput={setInput}
                send={send} profile={profile} progress={100}
                chipAnimal={chipAnimal} showAnimalToast={showAnimalToast} setShowAnimalToast={setShowAnimalToast}
                profileInsertIdx={profileInsertIdx} privacyMode={privacyMode}
              />
            )}
            {tab==="profile"&&(
              <>
                <input ref={photoRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ const f=e.target.files[0]; if(f)setUserPhoto(URL.createObjectURL(f)); e.target.value=""; }}/>
                <ProfileScreen
                  profile={profile}
                  privacyMode={privacyMode}
                  onPrivacyChange={setPrivacyMode}
                  userPhoto={userPhoto}
                  onPhotoUpload={setUserPhoto}
                  onLogout={()=>{ setScreen("splash"); setProfile(null); setMsgs([]); setHist([]); setStarted(false); setKicked(false); setTab("connect"); }}
                  onDeleteAccount={()=>{ setScreen("splash"); setProfile(null); setMsgs([]); setHist([]); setStarted(false); setKicked(false); setTab("connect"); }}
                />
              </>
            )}
          </div>
          <div style={{ display:"flex", borderTop:`1px solid ${C.border}`, background:C.surface, paddingBottom:8 }}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"10px 4px 4px", background:"none", border:"none", cursor:"pointer", gap:3 }}>
                {t.id==="reed"
                  ? <span style={{ fontSize:20, lineHeight:1, filter:tab===t.id?"none":"grayscale(1) opacity(0.4)" }}>{chipAnimal?.emoji||"😊"}</span>
                  : <TabIcon id={t.id} active={tab===t.id} color={t.color}/>
                }
                <span style={{ fontSize:9, color:tab===t.id?t.color:"rgba(255,255,255,0.38)", fontWeight:tab===t.id?700:400, textTransform:"uppercase", letterSpacing:0.5, fontFamily:DM }}>{t.label}</span>
                {tab===t.id&&<div style={{ width:16, height:2, borderRadius:1, background:t.color }}/>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  </div>
</>
```

);
}