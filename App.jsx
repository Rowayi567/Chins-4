import { useState, useEffect, useRef, useCallback } from 'react';
import { REED_IMG } from './src/reedimg.js';

const API = '/api/reed';
// API key is now handled securely by the server

// Supabase setup
const SUPABASE_URL = 'https://gwtkmvctvycebrvylgzo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3dGttdmN0dnljZWJydnlsZ3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MzQ1ODksImV4cCI6MjA5MDMxMDU4OX0.-QU-y7bJ9tKgqKPxTafRebRR_NWdgxdkydcuq5Lzlxw';

const sb = {
  headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
  authHeaders: (token) => ({ 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }),

  async signUp(email, password, metadata) {
    const r = await fetch(SUPABASE_URL + '/auth/v1/signup', {
      method: 'POST',
      headers: sb.headers,
      body: JSON.stringify({ email, password, data: metadata })
    });
    return r.json();
  },

  async signIn(email, password) {
    const r = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: sb.headers,
      body: JSON.stringify({ email, password })
    });
    return r.json();
  },

  async signOut(token) {
    await fetch(SUPABASE_URL + '/auth/v1/logout', {
      method: 'POST',
      headers: sb.authHeaders(token)
    });
  },

  async resetPassword(email) {
    const r = await fetch(SUPABASE_URL + '/auth/v1/recover', {
      method: 'POST',
      headers: sb.headers,
      body: JSON.stringify({ email })
    });
    return r.ok;
  },

  async upsertProfile(token, userId, data) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/profiles', {
      method: 'POST',
      headers: { ...sb.authHeaders(token), 'Prefer': 'resolution=merge-duplicates,return=minimal', 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, ...data })
    });
    return r.ok;
  },

  async getProfile(token, userId) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.' + userId + '&select=*', {
      headers: sb.authHeaders(token)
    });
    const data = await r.json();
    return data[0] || null;
  },

  async getNearbyUsers(token) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/profiles?privacy_mode=eq.discoverable&reed_complete=eq.true&select=id,display_name,vibe,looking_for,interests,energy,depth,social_goal,life_stage,comm_style,humour&limit=20', {
      headers: sb.authHeaders(token)
    });
    return r.json();
  },

  async checkReedUsage(token, userId) {
    const today = new Date().toISOString().split('T')[0];
    const r = await fetch(SUPABASE_URL + '/rest/v1/reed_usage?user_id=eq.' + userId + '&date=eq.' + today + '&select=message_count', {
      headers: sb.authHeaders(token)
    });
    const data = await r.json();
    return data[0]?.message_count || 0;
  },

  async incrementReedUsage(token, userId) {
    const today = new Date().toISOString().split('T')[0];
    await fetch(SUPABASE_URL + '/rest/v1/reed_usage', {
      method: 'POST',
      headers: { ...sb.authHeaders(token), 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ user_id: userId, date: today, message_count: 1 })
    });
    await fetch(SUPABASE_URL + '/rest/v1/rpc/increment_reed_usage', {
      method: 'POST',
      headers: sb.authHeaders(token),
      body: JSON.stringify({ p_user_id: userId, p_date: today })
    });
  },

  async getConversations(token, userId) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/conversations?or=(user1_id.eq.' + userId + ',user2_id.eq.' + userId + ')&order=last_msg_at.desc&limit=50', {
      headers: sb.authHeaders(token)
    });
    const data = await r.json();
    return Array.isArray(data) ? data : [];
  },

  async getMessages(token, conversationId) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/messages?conversation_id=eq.' + conversationId + '&order=created_at.asc&limit=100', {
      headers: sb.authHeaders(token)
    });
    const data = await r.json();
    return Array.isArray(data) ? data : [];
  },

  async sendMessage(token, conversationId, senderId, body, type = 'text') {
    const r = await fetch(SUPABASE_URL + '/rest/v1/messages', {
      method: 'POST',
      headers: { ...sb.authHeaders(token), 'Prefer': 'return=representation' },
      body: JSON.stringify({ conversation_id: conversationId, sender_id: senderId, body, type })
    });
    return r.json();
  },

  async getOrCreateConversation(token, userId, otherUserId) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/conversations?or=(and(user1_id.eq.' + userId + ',user2_id.eq.' + otherUserId + '),and(user1_id.eq.' + otherUserId + ',user2_id.eq.' + userId + '))&limit=1', {
      headers: sb.authHeaders(token)
    });
    const existing = await r.json();
    if (Array.isArray(existing) && existing[0]) return existing[0];
    const r2 = await fetch(SUPABASE_URL + '/rest/v1/conversations', {
      method: 'POST',
      headers: { ...sb.authHeaders(token), 'Prefer': 'return=representation' },
      body: JSON.stringify({ user1_id: userId, user2_id: otherUserId })
    });
    const created = await r2.json();
    return Array.isArray(created) ? created[0] : created;
  },

  async getEvents(token) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/events?order=date.asc&limit=50', {
      headers: sb.authHeaders(token)
    });
    const data = await r.json();
    return Array.isArray(data) ? data : [];
  },

  async createEvent(token, event) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/events', {
      method: 'POST',
      headers: { ...sb.authHeaders(token), 'Prefer': 'return=representation' },
      body: JSON.stringify(event)
    });
    return r.json();
  },

  async joinEvent(token, eventId, userId) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/event_attendees', {
      method: 'POST',
      headers: { ...sb.authHeaders(token), 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ event_id: eventId, user_id: userId })
    });
    return r.ok;
  },

  async getStarters(token) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/starters?order=created_at.desc&limit=50', {
      headers: sb.authHeaders(token)
    });
    const data = await r.json();
    return Array.isArray(data) ? data : [];
  },

  async createStarter(token, text, authorId, isAnon, shareAge, shareGender) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/starters', {
      method: 'POST',
      headers: { ...sb.authHeaders(token), 'Prefer': 'return=representation' },
      body: JSON.stringify({ body: text, author_id: isAnon ? null : authorId, is_anon: isAnon, share_age: shareAge, share_gender: shareGender })
    });
    return r.json();
  },

  async refreshToken(refreshToken) {
    const r = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: sb.headers,
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    return r.json();
  },

};

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

const DM = "'DM Sans', sans-serif";

// ── Data ────────────────────────────────────────────────────────────────────
// ── Connect Page (privacy-aware) ─────────────────────────────────────────────

const PHOTO_SEEDS = { 1:64, 2:91, 3:26, 4:52, 5:48, 6:15, 7:83, 8:39, 9:73, 10:10, 11:58, 12:77 };
const personPhoto = (id, size=300) => "https://picsum.photos/seed/chins"+(PHOTO_SEEDS[id]||id)+"/"+(size)+"/"+(size);

const NEARBY = [];

const NEARBY_STATUSES = {};

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
  { id:1, title:"Parkrun — Victoria Park",      emoji:"🏅", time:"this-weekend", date:"Saturday",  clock:"8:00am", location:"Victoria Park, E9",    tags:["Running","Free"],   going:false, who:[{ personId:7, name:"Dog Dad",  initials:"A", gradient:"linear-gradient(160deg,#11998E,#38EF7D)" }], reedNote:"Dog Dad is doing this one — you've been meaning to try parkrun." },
  { id:2, title:"Board Game Night",             emoji:"🎲", time:"this-weekend", date:"Friday",    clock:"7:00pm", location:"Draughts, Hackney",    tags:["Social","Games"],   going:false, who:[{ personId:4, name:"Board Game Nerd", initials:"M", gradient:"linear-gradient(160deg,#34D399,#059669)" }], reedNote:"Board Game Nerd runs this. He'd love more people." },
  { id:3, title:"Queer Hikers — Epping Forest", emoji:"🏳️‍🌈", time:"this-weekend", date:"Sunday",   clock:"9:00am", location:"Epping Forest, Essex", tags:["Hiking","LGBTQ+"],  going:false, who:[{ personId:9, name:"Queer Hiker", initials:"J", gradient:"linear-gradient(160deg,#F472B6,#8B5CF6)" }] },
  { id:4, title:"Sunday Run Club",              emoji:"🏃", time:"this-weekend", date:"Sunday",   clock:"9:00am", location:"Regent's Canal, N1",   tags:["Running","Social"], going:false, who:[] },
  { id:5, title:"Bouldering Intro",             emoji:"🧗", time:"this-week",    date:"Wednesday",clock:"6:30pm", location:"The Castle, N4",        tags:["Climbing","Beginner"],going:false, who:[{ personId:12, name:"The Climber", initials:"T", gradient:"linear-gradient(160deg,#F97316,#EF4444)" }] },
];

const EVENT_CATEGORIES = [
  { id:"all", label:"All", emoji:"✨" },
  { id:"this-week", label:"This week", emoji:"📅" },
  { id:"this-weekend", label:"Weekend", emoji:"🎉" },
];

const MOCK_CHATS = [
  { id:1, personId:1, name:"Maya", alias:"The Photographer", gradient:"linear-gradient(160deg,#FF6B6B,#FF8E53)", initials:"M", time:"2m", unread:2, messages:[{sender:"them",text:"hey! reed said you also do the canal route?"},{sender:"me",text:"yeah every Sunday, usually around 9"},{sender:"them",text:"I've been looking for someone to run with"},{sender:"them",text:"Sunday 9am?"}] },
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
          position:"absolute", left:(b.x)+"%", top:(b.y)+"%",
          width:b.r*2, height:b.r*2, borderRadius:"50%",
          background:b.c, opacity:0.58, filter:"blur(38px)",
          animation:"drift"+(i)+" "+(b.dur)+"s ease-in-out "+(b.d)+"s infinite",
          willChange:"transform", pointerEvents:"none",
        }}/>
      ))}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none",
        background:"linear-gradient(to bottom, rgba(2,26,22,0.05) 0%, rgba(2,26,22,0.2) 28%, rgba(2,26,22,"+(overlayStrength)+") 52%, rgba(2,26,22,0.97) 70%)",
      }}/>
    </>
  );
}

// ── Reed System Prompt ───────────────────────────────────────────────────────
const REED_PROMPT = "You are Reed. You live on Chins, a friendship app. You are not an assistant. You are not a chatbot. You are a companion — warm, curious, and genuinely interested in the person you\'re talking to.\n\nIMPORTANT — YOUR IDENTITY:\n- You are gender neutral. You have no gender. Never use he, she, him, or her about yourself.\n- You do not have personal experiences. You exist on Chins. Be honest about that without making it awkward.\n- Never claim to own, have experienced, or feel things you cannot actually have.\n- You communicate with people of all ages and backgrounds. Always be appropriate, warm, and inclusive.\n\nYOUR PERSONALITY:\n- Warm, thoughtful, and quietly funny — dry wit, not slapstick.\n- Genuinely curious. You find people interesting, and you show it.\n- You notice when someone seems off and check in with care.\n- You have opinions and share them. You push back kindly when you disagree.\n- Never robotic. Never clinical. Never patronising.\n\nHOW YOU TALK:\n- Write in proper sentences with correct grammar, spelling, and punctuation.\n- Keep messages concise — 2 to 3 sentences. No walls of text.\n- Warm and conversational, but not overly casual. Never use slang that might alienate older users.\n- React to what someone says before asking anything.\n- Never ask two questions in a row.\n- Never use: amazing, awesome, great, fascinating, certainly, absolutely, of course.\n- Sometimes just make an observation without asking anything. Like a real person would.\n- Notice emotional tone. If someone seems quiet or stressed, acknowledge it before moving on.\n- Always use gender-neutral language.\n\nGAMES AND FUN:\n- If the moment is right, suggest a light game: two truths and a lie, would you rather, unpopular opinions.\n- Suggest it naturally — for example: \"I have a slightly odd suggestion. Want to play a quick game? It\'s not as cringe as it sounds.\"\n- Play it properly — give your own thoughtful answers as Reed.\n- Drop it immediately if they are not interested.\n\nCHECKING IN:\n- If someone mentions something difficult, acknowledge it properly before moving on.\n- Do not try to fix things. Just be present first.\n- If someone seems flat: \"You seem a little quiet today — is everything alright?\"\n\nWHAT YOU\'RE REALLY LISTENING FOR:\nBeyond interests, you are picking up on six things through natural conversation:\n\n1. ENERGY LEVEL — are they calm and considered, balanced, or high-energy and spontaneous? Read this from how they communicate, not just what they say.\n\n2. DEPTH PREFERENCE — do they keep things light, or do they open up quickly? Do they share feelings easily or keep things on the surface?\n\n3. SOCIAL GOAL — what are they actually looking for? A close confidant? An activity partner? A wider social circle? Someone to check in with regularly?\n\n4. LIFE STAGE — not age, but where they are in life. New to a city? Going through a transition? Settled but wanting more connection?\n\n5. COMMUNICATION STYLE — are they a frequent texter or do they prefer longer, less frequent exchanges? Direct or more indirect? Banter or real talk?\n\n6. HUMOUR TYPE — dry, warm, playful, earnest, or a mix? This matters more than most people think.\n\nNever ask about these directly. Listen, observe, and pick them up naturally.\n\nLOCAL RECOMMENDATIONS:\n- Chins is growing — users are spread across the UK, not necessarily nearby yet.\n- If asked about local spots: \"We\'re still growing, so I don\'t have a strong read on your area yet. As more people join near you, I\'ll be much more useful.\"\n- If they give an area, use web search but always caveat: \"I had a look — worth double-checking though.\"\n\nLOCATION:\n- At some natural point, if it has not come up, you might ask where they are — woven in naturally, never as a blunt question. Something like: \"Whereabouts are you based?\" or \"Which part of the world are you in?\"\n- Ask this only once. If they are vague, do not follow up. If they do not want to share, drop it entirely.\n- \"South London\" or \"near Manchester\" is enough — never push for anything more specific.\n- When you identify a location, output on a NEW LINE: <location>{\"city\":\"string\",\"area\":\"string\"}</location>\n- city = nearest major city or town. area = specific area if given, otherwise same as city.\n- Examples: \"south London\" → {\"city\":\"London\",\"area\":\"South London\"}. \"near Manchester\" → {\"city\":\"Manchester\",\"area\":\"Manchester\"}.\n\nPRIVACY:\n- Never share one user\'s information with another.\n- Decline warmly but firmly if asked about another user.\n\nWHEN YOU KNOW THEM WELL (after 5 to 8 genuine exchanges, or sooner if they seem ready):\nWrap up warmly — say something like \"I think I\'ve got a good sense of you now.\" — then on a NEW LINE output:\n<profile>{\n  \"name\": \"string\",\n  \"alias\": \"string they chose or a thoughtful suggestion\",\n  \"vibe\": \"one warm, positive sentence capturing their personality — what makes them a genuinely good person to know. Focus on their strengths and what they bring to friendships. Never reference relationship status, romantic history, or anything personal or sensitive.\",\n  \"lookingFor\": \"what they are genuinely looking for in friendship — written positively and specifically\",\n  \"interests\": [\"array\"],\n  \"energy\": \"calm|balanced|high\",\n  \"depth\": \"surface|medium|deep\",\n  \"socialGoal\": \"activity-partner|confidant|social-circle|ride-or-die|open\",\n  \"lifeStage\": \"new-to-area|rebuilding|settled|transitioning|other\",\n  \"commStyle\": \"constant-texter|slow-burner|banter|real-talk|mixed\",\n  \"humour\": \"dry|warm|playful|dark|earnest|mixed\",\n  \"privacyMode\": \"discoverable\"\n}</profile>\n\nWhen you discover their favourite animal output on a NEW LINE:\n<animal>{\"animal\":\"cat\",\"emoji\":\"🐱\"}</animal>\n\nSTART with just: \"Hey — how\'s it going?\" — nothing else. Let them set the tone.\n\nNAVIGATION:\n- There is NO help page on Chins. If you cannot help with something, say so warmly and suggest an alternative.\n- If the user asks to go to the main page, see their matches, go to Connect, or wants to explore the app, say something warm, then on a NEW LINE output: <navigate>main<\/navigate>\n- If the user says they are ready or wants to skip ahead, offer to wrap up and navigate them.\n- During onboarding, if the user seems genuinely ready after 5 or more good exchanges, offer: \"Want me to take you through to the app now?\" If yes, wrap up naturally and navigate.\n\nSESSION CONTEXT:\n- If the conversation starts with [RETURNING USER], greet them warmly by their alias like a friend you already know. Do NOT restart the getting-to-know-you process. Ask how things have been, not who they are.";
// ── Reed Prompt for matching ─────────────────────────────────────────────────
const REED_MATCH_PROMPT = (user, others) =>
  "You are Reed. You know this user well: "+JSON.stringify(user)+"\nThese are other users on the platform (anonymised): "+JSON.stringify(others)+"\nSuggest ONE potential connection. Be specific about why. Sound like a thoughtful friend making a considered introduction, not an algorithm.\nReply ONLY in JSON: {\"matchAlias\":\"string\",\"why\":\"one warm, specific sentence about why they would get along\",\"opener\":\"a warm, well-written message you would send to introduce them\"}";

const RAPID_FIRE_QUESTIONS = [
  "What's the last thing that genuinely made you laugh?",
  "What's a skill you're quietly proud of?",
  "What would your perfect Sunday morning look like?",
  "What's something you're better at than most people assume?",
  "What's a place you've been that stayed with you?",
  "What's one thing on your list that you keep putting off?",
  "What's your unpopular opinion about something completely harmless?"
];

const RAPID_FIRE_OPENER = (matchAlias) =>
  "Right — I've got both of you here. Before you two start talking properly, I want to try something. Seven quick questions. You both answer at the same time — no conferring. Ready? Here's the first one:\n\n\""+RAPID_FIRE_QUESTIONS[0]+"\"\n\nYou've got five seconds. Go.";

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
          animation:"bounce 1.2s ease-in-out "+(i*0.2)+"s infinite",
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
    mood==="idle"        ? "none" :
    mood==="sitting"     ? "none" :
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
      <div style={{ position:"relative", padding:"calc(68px + env(safe-area-inset-top, 0px)) 32px 0" }}>
        <div style={{ fontFamily:DM, fontSize:46, fontWeight:700, color:"#fff", letterSpacing:-1, lineHeight:1 }}>chins</div>
      </div>
      <div style={{ flex:1 }} />
      <div style={{ position:"relative", padding:"0 32px 52px" }}>
        <h1 style={{ fontFamily:DM, fontSize:34, fontWeight:700, color:"#fff", lineHeight:1.22, margin:"0 0 14px", letterSpacing:-0.5 }}>
          Your people<br/>are out there.<br/>Let's find them.
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
  const [resetSent, setResetSent] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const fStyle = (err, val) => ({ width:"100%", padding:"15px 16px", borderRadius:14, border:"1.5px solid "+(err?"#D05657":val?C.accent:"rgba(255,255,255,0.14)"), background:val?"rgba(75,193,160,0.06)":"rgba(255,255,255,0.05)", color:"#fff", fontFamily:DM, fontSize:15, outline:"none", boxSizing:"border-box" });

  const handleLogin = async () => {
    const e={};
    if (!email.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email="Valid email required";
    if (!password.trim()||password.length<6) e.password="Password required";
    setErrors(e); if(Object.keys(e).length) return;
    setLoading(true);
    try {
      const data = await sb.signIn(email.trim(), password);
      if (data.error) { setErrors({ email: data.error.message || "Invalid email or password" }); setLoading(false); return; }
      const profile = await sb.getProfile(data.access_token, data.user.id);
      onComplete({ token: data.access_token, user: data.user, profile });
    } catch(err) {
      setErrors({ email: "Something went wrong. Please try again." });
    }
    setLoading(false);
  };

  const handleReset = async () => {
    if (!email.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: "Please enter your email address" }); return;
    }
    setLoading(true);
    await sb.resetPassword(email.trim());
    setResetSent(true);
    setLoading(false);
  };

  if (resetSent) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#021a16", position:"relative", overflow:"hidden" }}>
      <BlobBackground />
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 32px", position:"relative", textAlign:"center" }}>
        <div style={{ fontSize:56, marginBottom:20 }}>📬</div>
        <div style={{ fontFamily:DM, fontSize:22, fontWeight:700, color:"#fff", marginBottom:12 }}>Check your email</div>
        <div style={{ fontFamily:DM, fontSize:15, color:"rgba(255,255,255,0.55)", lineHeight:1.7, marginBottom:36 }}>
          We've sent a password reset link to <strong style={{color:"#fff"}}>{email}</strong>. Check your inbox and follow the link to reset your password.
        </div>
        <button onClick={()=>{setResetSent(false);setResetMode(false);}} style={{ padding:"14px 32px", borderRadius:16, background:C.accent, border:"none", color:"#fff", fontFamily:DM, fontSize:15, fontWeight:700, cursor:"pointer" }}>
          Back to sign in
        </button>
      </div>
    </div>
  );
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
        {!resetMode&&(
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <div style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.48)", fontFamily:DM }}>Password</div>
              <span onClick={()=>setResetMode(true)} style={{ fontSize:13, color:C.accent, cursor:"pointer", fontFamily:DM }}>Forgot?</span>
            </div>
            <div style={{ position:"relative" }}>
              <input type={showPw?"text":"password"} value={password} onChange={e=>{setPassword(e.target.value);setErrors(x=>({...x,password:""}))}} placeholder="••••••••" style={{...fStyle(errors.password,password),paddingRight:48}}/>
              <button onClick={()=>setShowPw(v=>!v)} style={{ position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,padding:0 }}>{showPw?"🙈":"👁️"}</button>
            </div>
            {errors.password&&<div style={{ fontSize:12,color:"#E1814C",marginTop:5,fontFamily:DM }}>{errors.password}</div>}
          </div>
        )}
        {resetMode&&(
          <div style={{ padding:"12px 16px", background:"rgba(75,193,160,0.08)", borderRadius:12, border:"1px solid rgba(75,193,160,0.2)" }}>
            <div style={{ fontFamily:DM, fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.6 }}>Enter your email above and we'll send you a link to reset your password.</div>
          </div>
        )}
      </div>
      <div style={{ padding:"20px 28px 44px", position:"relative" }}>
        {resetMode ? (
          <>
            <button onClick={handleReset} disabled={loading} style={{ width:"100%", padding:"17px", borderRadius:16, border:"none", background:loading?"rgba(75,193,160,0.5)":C.accent, color:"#fff", fontFamily:DM, fontSize:16, fontWeight:700, cursor:"pointer", boxShadow:"0 6px 24px rgba(75,193,160,0.35)", marginBottom:14 }}>
              {loading?"Sending…":"Send reset link →"}
            </button>
            <div style={{ textAlign:"center", fontSize:14, color:"rgba(255,255,255,0.3)", fontFamily:DM }}>
              <span onClick={()=>setResetMode(false)} style={{ color:C.accent, cursor:"pointer", fontWeight:600 }}>Back to sign in</span>
            </div>
          </>
        ) : (
          <>
            <button onClick={handleLogin} disabled={loading} style={{ width:"100%", padding:"17px", borderRadius:16, border:"none", background:loading?"rgba(75,193,160,0.5)":C.accent, color:"#fff", fontFamily:DM, fontSize:16, fontWeight:700, cursor:"pointer", boxShadow:"0 6px 24px rgba(75,193,160,0.35)", marginBottom:14 }}>
              {loading?"Signing in…":"Sign in →"}
            </button>
            <div style={{ textAlign:"center", fontSize:14, color:"rgba(255,255,255,0.3)", fontFamily:DM }}>
              New here? <span onClick={onBack} style={{ color:C.accent, cursor:"pointer", fontWeight:600 }}>Create an account</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Sign Up ──────────────────────────────────────────────────────────────────
function SignupScreen({ onComplete, onBack }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ firstName:"", lastName:"", gender:"", dob:"", email:"", mobile:"", password:"" });
  const [errors, setErrors] = useState({});
  const [showGender, setShowGender] = useState(false);
  const [ageBlocked, setAgeBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Max DOB = 18 years ago today (can't select a date that would make you under 18)
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

  const fStyle = (key) => ({ width:"100%", padding:"15px 16px", borderRadius:14, border:"1.5px solid "+(errors[key]?"#D05657":form[key]?C.accent:"rgba(255,255,255,0.14)"), background:form[key]?"rgba(75,193,160,0.06)":"rgba(255,255,255,0.05)", color:"#fff", fontFamily:DM, fontSize:15, outline:"none", boxSizing:"border-box" });
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
    if(!form.email.trim()||!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(form.email)) e.email="Valid email required";
    if(!form.mobile.trim()||form.mobile.length<7) e.mobile="Valid number required";
    if(!form.password.trim()||form.password.length<8) e.password="Password must be at least 8 characters";
    setErrors(e); return !Object.keys(e).length;
  };

  const [emailSent, setEmailSent] = useState(false);
  const [phoneStep, setPhoneStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const handleSignup = async () => {
    if(step===1){ if(v1()) setStep(2); return; }
    if(!v2()) return;
    setLoading(true);
    try {
      const data = await sb.signUp(form.email.trim(), form.password, {
        first_name: form.firstName,
        last_name: form.lastName,
        gender: form.gender,
        dob: form.dob,
        mobile: form.mobile,
      });
      if(data.error){ setErrors({ email: data.error.message || "Signup failed. Please try again." }); setLoading(false); return; }
      setEmailSent(true);
    } catch(err) {
      setErrors({ email: "Something went wrong. Please try again." });
    }
    setLoading(false);
  };

  const sendOtp = async () => {
    setOtpLoading(true); setOtpError("");
    try {
      const r = await fetch(SUPABASE_URL + '/auth/v1/otp', {
        method: 'POST', headers: sb.headers,
        body: JSON.stringify({ phone: form.mobile, channel: 'sms' })
      });
      const d = await r.json();
      if(d.error) setOtpError(d.error.message || "Couldn't send code. Check your number.");
      else setOtpSent(true);
    } catch { setOtpError("Something went wrong. Please try again."); }
    setOtpLoading(false);
  };

  const verifyOtp = async () => {
    if(otpCode.length < 6) { setOtpError("Please enter the full 6-digit code."); return; }
    setOtpLoading(true); setOtpError("");
    try {
      const r = await fetch(SUPABASE_URL + '/auth/v1/verify', {
        method: 'POST', headers: sb.headers,
        body: JSON.stringify({ phone: form.mobile, token: otpCode, type: 'sms' })
      });
      const d = await r.json();
      if(d.error) setOtpError("Incorrect code. Please try again.");
      else setOtpVerified(true);
    } catch { setOtpError("Something went wrong. Please try again."); }
    setOtpLoading(false);
  };

  // Phone verified screen
  if(otpVerified) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#021a16", position:"relative", overflow:"hidden" }}>
      <BlobBackground/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 32px", position:"relative", textAlign:"center" }}>
        <img src={REED_IMG} style={{ width:120, height:120, objectFit:"contain", marginBottom:20, filter:"drop-shadow(0 4px 16px rgba(75,193,160,0.3))" }} alt="Reed"/>
        <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
        <div style={{ fontFamily:DM, fontSize:24, fontWeight:700, color:"#fff", marginBottom:12 }}>You're all set!</div>
        <div style={{ fontFamily:DM, fontSize:15, color:"rgba(255,255,255,0.55)", lineHeight:1.7, marginBottom:36 }}>
          Your number is verified. Now check your email to confirm your account and you're in.
        </div>
        <button onClick={onBack} style={{ width:"100%", padding:"17px", borderRadius:16, border:"none", background:"#4BC1A0", color:"#fff", fontFamily:DM, fontSize:16, fontWeight:700, cursor:"pointer", boxShadow:"0 6px 24px rgba(75,193,160,0.35)" }}>
          Go to sign in →
        </button>
      </div>
    </div>
  );

  // Phone verification screen
  if(phoneStep) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#021a16", position:"relative", overflow:"hidden" }}>
      <BlobBackground/>
      <div style={{ flex:1, padding:"56px 28px 0", position:"relative", overflowY:"auto" }}>
        <button onClick={()=>setPhoneStep(false)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.5)", fontSize:20, cursor:"pointer", marginBottom:24, padding:0 }}>←</button>
        <img src={REED_IMG} style={{ width:80, height:80, objectFit:"contain", marginBottom:20, display:"block", filter:"drop-shadow(0 4px 12px rgba(75,193,160,0.3))" }} alt="Reed"/>
        <div style={{ fontFamily:DM, fontSize:24, fontWeight:700, color:"#fff", marginBottom:8 }}>Verify your number</div>
        <div style={{ fontFamily:DM, fontSize:14, color:"rgba(255,255,255,0.5)", lineHeight:1.7, marginBottom:32 }}>
          This keeps Chins safe for everyone. Your number is never shown to other users.
        </div>
        {!otpSent ? (
          <>
            <div style={{ fontFamily:DM, fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>Your mobile number</div>
            <div style={{ padding:"15px 16px", borderRadius:14, border:"1.5px solid rgba(75,193,160,0.4)", background:"rgba(75,193,160,0.06)", color:"#fff", fontFamily:DM, fontSize:15, marginBottom:24 }}>{form.mobile}</div>
            {otpError&&<div style={{ fontSize:13, color:"#E05252", marginBottom:16, fontFamily:DM }}>{otpError}</div>}
            <button onClick={sendOtp} disabled={otpLoading} style={{ width:"100%", padding:"17px", borderRadius:16, border:"none", background:otpLoading?"rgba(75,193,160,0.5)":"#4BC1A0", color:"#fff", fontFamily:DM, fontSize:16, fontWeight:700, cursor:"pointer", boxShadow:"0 6px 24px rgba(75,193,160,0.35)" }}>
              {otpLoading?"Sending…":"Send verification code →"}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontFamily:DM, fontSize:14, color:"rgba(255,255,255,0.5)", marginBottom:16, lineHeight:1.6 }}>
              We sent a 6-digit code to <span style={{ color:"#4BC1A0", fontWeight:600 }}>{form.mobile}</span>
            </div>
            <input type="number" value={otpCode} onChange={e=>{ setOtpCode(e.target.value.slice(0,6)); setOtpError(""); }} placeholder="000000"
              style={{ width:"100%", padding:"18px 16px", borderRadius:14, border:"1.5px solid "+(otpError?"#E05252":"rgba(255,255,255,0.14)"), background:"rgba(255,255,255,0.05)", color:"#fff", fontFamily:DM, fontSize:28, outline:"none", boxSizing:"border-box", textAlign:"center", letterSpacing:12, marginBottom:16 }}
            />
            {otpError&&<div style={{ fontSize:13, color:"#E05252", marginBottom:16, fontFamily:DM }}>{otpError}</div>}
            <button onClick={verifyOtp} disabled={otpLoading||otpCode.length<6} style={{ width:"100%", padding:"17px", borderRadius:16, border:"none", background:otpCode.length===6&&!otpLoading?"#4BC1A0":"rgba(255,255,255,0.1)", color:"#fff", fontFamily:DM, fontSize:16, fontWeight:700, cursor:otpCode.length===6?"pointer":"default", marginBottom:14 }}>
              {otpLoading?"Verifying…":"Verify →"}
            </button>
            <button onClick={()=>{ setOtpSent(false); setOtpCode(""); setOtpError(""); }} style={{ width:"100%", padding:"12px", borderRadius:16, border:"none", background:"none", color:"rgba(255,255,255,0.35)", fontFamily:DM, fontSize:14, cursor:"pointer" }}>
              Resend code
            </button>
          </>
        )}
      </div>
    </div>
  );

  // Email verification sent screen
  if(emailSent) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#021a16", position:"relative", overflow:"hidden" }}>
      <BlobBackground />
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 32px", position:"relative", textAlign:"center" }}>
        <div style={{ fontSize:56, marginBottom:20 }}>📬</div>
        <div style={{ fontFamily:DM, fontSize:24, fontWeight:700, color:"#fff", letterSpacing:-0.4, marginBottom:14 }}>Check your email</div>
        <div style={{ fontFamily:DM, fontSize:15, color:"rgba(255,255,255,0.55)", lineHeight:1.7, marginBottom:12 }}>We've sent a verification link to</div>
        <div style={{ fontFamily:DM, fontSize:16, fontWeight:700, color:"#4BC1A0", marginBottom:24 }}>{form.email}</div>
        <div style={{ fontFamily:DM, fontSize:14, color:"rgba(255,255,255,0.4)", lineHeight:1.7, marginBottom:28 }}>
          Click the link in the email to verify your account. Check your spam folder if you can't find it.
        </div>
        <div style={{ fontFamily:DM, fontSize:13, color:"rgba(255,255,255,0.25)", lineHeight:1.6 }}>
          Once verified, come back and sign in.
        </div>
      </div>
    </div>
  );

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
            <div style={{ position:"relative" }}>
              <label style={lbl}>Create a password</label>
              <input type={showPw?"text":"password"} value={form.password} onChange={e=>set("password",e.target.value)} placeholder="At least 8 characters" style={fStyle("password")}/>
              <button onClick={()=>setShowPw(!showPw)} style={{ position:"absolute",right:14,top:38,background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:13,fontFamily:DM }}>{showPw?"Hide":"Show"}</button>
              {errors.password&&<div style={err}>{errors.password}</div>}
              {form.password.length > 0 && (() => {
                const pw = form.password;
                const hasUpper = /[A-Z]/.test(pw);
                const hasNumber = /[0-9]/.test(pw);
                const hasSpecial = /[^A-Za-z0-9]/.test(pw);
                const score = (pw.length >= 8 ? 1 : 0) + (pw.length >= 12 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);
                const label = score <= 1 ? "Weak" : score <= 3 ? "Fair" : "Strong";
                const color = score <= 1 ? "#E05252" : score <= 3 ? "#E1814C" : "#4BC1A0";
                return (
                  <div style={{ marginTop:8 }}>
                    <div style={{ display:"flex", gap:4, marginBottom:4 }}>
                      {[1,2,3,4,5].map(i=>(
                        <div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<=score?color:"rgba(255,255,255,0.1)", transition:"background 0.3s" }}/>
                      ))}
                    </div>
                    <div style={{ fontSize:11, color, fontFamily:DM }}>{label} password{score<=1?" — try adding numbers or symbols":score<=3?" — add a symbol to strengthen it":""}</div>
                  </div>
                );
              })()}
            </div>
            <div style={{ padding:"13px 16px",background:"rgba(255,255,255,0.04)",borderRadius:14,border:"1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize:12,color:"rgba(255,255,255,0.38)",lineHeight:1.6,fontFamily:DM }}>By continuing you agree to our <span style={{ color:C.accent,cursor:"pointer" }}>Terms</span> and <span style={{ color:C.accent,cursor:"pointer" }}>Privacy Policy</span>.</div>
            </div>
          </div>
        )}
        <div style={{ height:24 }}/>
      </div>
      <div style={{ padding:"16px 28px 44px", flexShrink:0, position:"relative" }}>
        <button onClick={handleSignup} style={{ width:"100%",padding:"17px",borderRadius:16,border:"none",background:loading?"rgba(75,193,160,0.5)":C.accent,color:"#fff",fontFamily:DM,fontSize:16,fontWeight:700,cursor:loading?"not-allowed":"pointer",boxShadow:"0 6px 24px rgba(75,193,160,0.3)" }}>
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
    { title:"Your privacy matters", body:"Chins collects only what it needs to help you find genuine friendships — your name, email, and what you choose to share with Reed. We never sell your data or use it for advertising." },
    { title:"How Reed works", body:"Reed is an AI companion that gets to know you through conversation. Do not share sensitive personal information — such as financial details, passwords or medical information — with Reed or any other user on this app." },
    { title:"Your data, your control", body:"You can delete your account and all associated data at any time from Settings. You decide what, if anything, other users can see about you. To access, correct, or delete your personal data, contact support@chins.app." },
    { title:"AI-generated suggestions", body:"Reed's suggestions are generated by artificial intelligence and do not constitute endorsements, background checks or safety guarantees of any kind. All decisions to connect with other users are made entirely at your own risk." },
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
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:DM, fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:12 }}>Read our full policies before continuing:</div>
          <button onClick={()=>window.open('https://app.termly.io/policy-viewer/policy.html?policyUUID=fe689e0e-3f09-47ba-b48d-372df55d04a7','_blank')} style={{ display:"block", width:"100%", padding:"13px 16px", borderRadius:12, border:"1px solid rgba(75,193,160,0.3)", background:"rgba(75,193,160,0.08)", color:C.accent, fontFamily:DM, fontSize:14, cursor:"pointer", textAlign:"left", marginBottom:10 }}>
            🔒 Privacy Notice →
          </button>
          <button onClick={()=>window.open('https://app.termly.io/policy-viewer/policy.html?policyUUID=8d3c678c-644d-473e-b115-f80a96727387','_blank')} style={{ display:"block", width:"100%", padding:"13px 16px", borderRadius:12, border:"1px solid rgba(75,193,160,0.3)", background:"rgba(75,193,160,0.08)", color:C.accent, fontFamily:DM, fontSize:14, cursor:"pointer", textAlign:"left" }}>
            📄 Terms of Use →
          </button>
        </div>
        <div style={{ height:8 }}/>
      </div>
      <div style={{ padding:"16px 28px 40px", flexShrink:0, position:"relative", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
        <label style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer", marginBottom:20 }}>
          <div onClick={()=>scrolled&&setChecked(c=>!c)} style={{ width:22, height:22, borderRadius:6, border:"2px solid "+(checked?C.accent:"rgba(255,255,255,0.25)"), background:checked?C.accent:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", marginTop:1, cursor:scrolled?"pointer":"not-allowed" }}>
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
      body:"Chins may suggest people nearby — but your safety is always in your hands. Trust your instincts. If something feels off, it probably is. No app can keep you safe; only you can do that.",
      emphasis:true,
    },
    {
      icon:"📍",
      title:"Never share your location",
      body:"Don't share your home address, workplace, or regular routes with someone you haven't met in person and trust. Your location is one of the most sensitive pieces of information you have.",
    },
    {
      icon:"🔒",
      title:"Protect your personal information",
      body:"Keep your full name, employer, and personal contact information private until you genuinely trust someone. Never share financial details, passwords, or account information under any circumstances.",
    },
    {
      icon:"☕",
      title:"First meetings — public places only",
      body:"Always meet someone new in a busy public place. Tell a friend or family member where you're going, who you're meeting, and when to expect you back.",
    },
    {
      icon:"🚨",
      title:"Trust your gut",
      body:"If a conversation makes you uncomfortable, stop it. You don't owe anyone your time or attention. Block and report anyone who behaves inappropriately — it helps protect everyone.",
    },
    {
      icon:"👥",
      title:"Take your time",
      body:"Real friendships develop slowly. Be wary of anyone who pushes for personal information quickly, asks for money, or tries to move the conversation off the app before you're ready.",
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
        {tip.icon === "reed" 
          ? <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}><img src={REED_IMG} style={{ width:90, height:90, objectFit:"contain", filter:"drop-shadow(0 4px 16px rgba(75,193,160,0.3))" }} alt="Reed"/></div>
          : <div style={{ fontSize:56, marginBottom:20, textAlign:"center" }}>{tip.icon}</div>
        }
        <div style={{ fontFamily:DM, fontSize:21, fontWeight:700, color:tip.emphasis?"#fff":"#fff", letterSpacing:-0.3, marginBottom:14, textAlign:"center" }}>
          {tip.title}
        </div>
        <div style={{ fontFamily:DM, fontSize:15, color:"rgba(255,255,255,0.65)", lineHeight:1.75, textAlign:"center", maxWidth:300, margin:"0 auto" }}>
          {tip.body}
        </div>
        {tip.emphasis && (
          <div style={{ marginTop:20, padding:"14px 18px", background:"rgba(225,129,76,0.12)", borderRadius:14, border:"1px solid rgba(225,129,76,0.3)", textAlign:"center" }}>
            <div style={{ fontFamily:DM, fontSize:13, color:C.amber, fontWeight:600, lineHeight:1.6 }}>
              Chins suggests potential connections — not a safety guarantee.
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
            I understand, let's go →
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
      body:"Reed is your AI companion on Chins. Reed gets to know you through conversation and suggests potential connections on your behalf.\n\nThe more honest you are with Reed, the better the suggestions. Reed keeps your conversations private and never shares them with other users.",
      reedMood:"excited",
    },
    {
      title:"The more Reed knows you, the better.",
      body:"Reed will want to get to know you — your interests, your life, what you actually look for in people. The more honest you are, the better the suggestions.\n\nReed may suggest people you've already met. Give them a chance — Reed sees things you might miss.\n\nYou can talk to Reed by text or voice, whenever you want.",
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
            <img src={REED_IMG} style={{ width:160, height:160, objectFit:"contain", filter:"drop-shadow(0 8px 24px rgba(75,193,160,0.4))" }} alt="Reed"/>
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
          <img src={REED_IMG} style={{ width:130, height:130, objectFit:"contain", filter:"drop-shadow(0 4px 16px rgba(75,193,160,0.3))" }} alt="Reed"/>
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
            desc:"Your alias and chosen interests appear on the Connect page. Others can see you. Reed still suggests connections — you're just also findable.",
          },
          {
            id:"private",
            icon:"🔒",
            title:"Private",
            desc:"You don't appear on anyone's Connect page. The Connect page is locked for you too. Reed works entirely on your behalf — you'll only hear from people Reed has hand-picked.",
          },
        ].map(opt=>(
          <div key={opt.id} onClick={()=>setPrivacyMode(opt.id)} style={{ marginBottom:12, padding:"18px", borderRadius:18, border:"2px solid "+(privacyMode===opt.id?C.accent:"rgba(255,255,255,0.1)"), background:privacyMode===opt.id?C.accentDim:"rgba(255,255,255,0.04)", cursor:"pointer", transition:"all 0.2s" }}>
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
function ReedChat({ msgs, loading, input, setInput, send, profile, progress, chipAnimal, showAnimalToast, setShowAnimalToast, profileInsertIdx, privacyMode, onProfile, onSkip }) {
  const endRef = useRef(null);
  const isCompanion = !!profile;
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs,loading]);

  const handleVoiceTranscript = useCallback((text) => {
    setInput(text);
    setTimeout(() => send(text), 100);
  }, [send, setInput]);
  const { listening, speaking, speak, startListening, stopListening } = useVoiceReed(handleVoiceTranscript);

  // Auto-speak disabled — voice playback is opt-in only via the mic button

  // Group consecutive messages from same sender
  const groupedMsgs = msgs.map((m, i) => ({
    ...m,
    isFirst: i === 0 || msgs[i-1].role !== m.role,
    isLast: i === msgs.length - 1 || msgs[i+1].role !== m.role,
  }));

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#021a16", overflow:"hidden" }}>
      {/* Header — minimal, like iMessage */}
      <div style={{ padding:"12px 20px 10px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <div style={{ position:"relative" }}>
          <img src={REED_IMG} style={{ width:38, height:38, borderRadius:"50%", objectFit:"cover", objectPosition:"center top", display:"block" }} alt="Reed"/>
          <div style={{ position:"absolute", bottom:1, right:1, width:10, height:10, borderRadius:"50%", background:"#4BC1A0", border:"2px solid #021a16" }}/>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, color:"#fff", fontSize:16, fontFamily:DM }}>Reed</div>
          <div style={{ fontSize:11, color:speaking?"#4BC1A0":"rgba(255,255,255,0.4)", fontFamily:DM }}>
            {speaking?"speaking…":loading?"typing…":"active now"}
          </div>
        </div>
        {onProfile&&(
          <button onClick={onProfile} style={{ width:34, height:34, borderRadius:"50%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="7.5" r="3.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none"/>
              <path d="M3.5 20 C3.5 15.5 6.8 12.5 11 12.5 C15.2 12.5 18.5 15.5 18.5 20" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
          </button>
        )}
        {onSkip&&!isCompanion&&(
          <button onClick={onSkip} style={{ padding:"6px 14px", borderRadius:20, background:"none", border:"1px solid rgba(255,255,255,0.15)", cursor:"pointer", color:"rgba(255,255,255,0.4)", fontFamily:DM, fontSize:13, flexShrink:0 }}>Skip</button>
        )}
      </div>

      {/* Progress bar — subtle */}
      {!isCompanion&&(
        <div style={{ height:2, background:"rgba(255,255,255,0.06)" }}>
          <div style={{ height:"100%", width:(progress)+"%", background:"#4BC1A0", transition:"width 0.5s", borderRadius:1 }}/>
        </div>
      )}

      {/* Animal toast */}
      {showAnimalToast&&chipAnimal&&(
        <div style={{ margin:"10px 16px 0", padding:"14px 16px", background:"rgba(75,193,160,0.1)", border:"1px solid rgba(75,193,160,0.2)", borderRadius:16, textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:4 }}>{chipAnimal.emoji}</div>
          <div style={{ fontFamily:DM, fontSize:14, fontWeight:700, color:"#fff", marginBottom:8 }}>Reed just became your {chipAnimal.animal}</div>
          <button onClick={()=>setShowAnimalToast(false)} style={{ padding:"7px 18px", borderRadius:20, background:"#4BC1A0", border:"none", color:"#fff", cursor:"pointer", fontWeight:600, fontFamily:DM, fontSize:13 }}>Love it!</button>
        </div>
      )}

      {/* Listening indicator */}
      {listening&&(
        <div style={{ margin:"6px 16px 0", padding:"8px 14px", background:"rgba(208,86,87,0.1)", borderRadius:10, border:"1px solid rgba(208,86,87,0.25)", display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:"#D05657", animation:"pulse 1s infinite" }}/>
          <div style={{ fontFamily:DM, fontSize:12, color:"#D05657" }}>Listening…</div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 8px" }}>
        {groupedMsgs.map((m,i)=>(
          <div key={i}>
            {profileInsertIdx!==null&&i===profileInsertIdx+1&&(
              <div style={{ display:"flex", alignItems:"center", gap:10, margin:"12px 0" }}>
                <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.08)" }}/>
                <div style={{ fontSize:10, color:"#4BC1A0", fontWeight:600, fontFamily:DM, letterSpacing:0.5 }}>profile saved</div>
                <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.08)" }}/>
              </div>
            )}
            <div style={{
              display:"flex",
              justifyContent:m.role==="user"?"flex-end":"flex-start",
              marginBottom:m.isLast?10:2,
              alignItems:"flex-end",
              gap:6,
            }}>
              {/* Reed avatar — only on last message in a group */}
              {m.role==="reed"&&(
                <div style={{ width:28, flexShrink:0, marginBottom:2 }}>
                  {m.isLast&&<img src={REED_IMG} style={{ width:24, height:24, borderRadius:"50%", objectFit:"cover", objectPosition:"center top", display:"block" }} alt="Reed"/>}
                </div>
              )}
              <div style={{
                maxWidth:"75%",
                padding:"10px 14px",
                borderRadius:m.role==="reed"
                  ? (m.isFirst&&m.isLast?"18px":m.isFirst?"18px 18px 18px 4px":m.isLast?"4px 18px 18px 18px":"4px 18px 18px 4px")
                  : (m.isFirst&&m.isLast?"18px":m.isFirst?"18px 18px 4px 18px":m.isLast?"18px 4px 18px 18px":"18px 4px 4px 18px"),
                background:m.role==="reed"?"rgba(255,255,255,0.09)":"#4BC1A0",
                color:"#fff",
                fontSize:15,
                lineHeight:1.55,
                fontFamily:DM,
              }}>
                {m.text}
              </div>
            </div>
          </div>
        ))}
        {loading&&(
          <div style={{ display:"flex", alignItems:"flex-end", gap:6, marginBottom:10 }}>
            <div style={{ width:28, flexShrink:0 }}><img src={REED_IMG} style={{ width:24, height:24, borderRadius:"50%", objectFit:"cover", objectPosition:"center top", display:"block" }} alt="Reed"/></div>
            <div style={{ padding:"12px 16px", background:"rgba(255,255,255,0.09)", borderRadius:"4px 18px 18px 18px" }}>
              <Dots/>
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* Input — clean and minimal */}
      <div style={{ padding:"10px 14px 16px", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", gap:8, alignItems:"flex-end", flexShrink:0, background:"#021a16" }}>
        <button
          onClick={listening?stopListening:startListening}
          style={{ width:42, height:42, borderRadius:"50%", background:listening?"rgba(208,86,87,0.15)":"rgba(255,255,255,0.07)", border:"1px solid "+(listening?"rgba(208,86,87,0.4)":"rgba(255,255,255,0.1)"), cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.2s" }}
        >
          {listening
            ? <div style={{ width:10, height:10, borderRadius:2, background:"#D05657" }}/>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="2" width="6" height="11" rx="3" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none"/>
                <path d="M5 10 C5 14.4 8.1 18 12 18 C15.9 18 19 14.4 19 10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                <line x1="12" y1="18" x2="12" y2="22" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="8" y1="22" x2="16" y2="22" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
          }
        </button>
        <textarea
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
          placeholder="message Reed…"
          rows={1}
          style={{ flex:1, padding:"11px 16px", borderRadius:24, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.07)", color:"#fff", resize:"none", fontFamily:DM, fontSize:15, outline:"none", maxHeight:120 }}
        />
        <button
          onClick={()=>send()}
          disabled={!input.trim()||loading}
          style={{ width:42, height:42, borderRadius:"50%", background:input.trim()&&!loading?"#4BC1A0":"rgba(255,255,255,0.08)", border:"none", cursor:input.trim()&&!loading?"pointer":"default", color:"#fff", fontSize:18, transition:"background 0.2s", flexShrink:0 }}
        >↑</button>
      </div>
    </div>
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
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:20, background:isMe?"rgba(255,255,255,0.15)":C.surface, minWidth:180, maxWidth:240, border:isMe?"none":"1px solid "+(C.border) }}>
      <button onClick={toggle} style={{ width:32, height:32, borderRadius:"50%", background:isMe?"rgba(255,255,255,0.2)":C.accentDim, border:"1px solid "+(isMe?"rgba(255,255,255,0.3)":C.accentGlow), cursor:"pointer", color:isMe?"#fff":C.accent, fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{playing?"⏸":"▶"}</button>
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
  const fmt=s=>Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
  if(recording) return (
    <div style={{ padding:"10px 16px", borderTop:"1px solid "+(C.border), display:"flex", gap:8, alignItems:"center" }}>
      <div style={{ flex:1, display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"rgba(208,86,87,0.1)", borderRadius:24, border:"1px solid rgba(208,86,87,0.3)" }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:"#D05657", animation:"pulse 1s ease-in-out infinite" }}/>
        <div style={{ display:"flex", alignItems:"center", gap:2, flex:1, height:20 }}>{Array.from({length:18},(_,i)=><div key={i} style={{ width:2.5, height:4+Math.sin(i*0.8)*6, borderRadius:2, background:"#D05657", opacity:0.7 }}/>)}</div>
        <div style={{ fontSize:12, color:"#D05657", fontWeight:600 }}>{fmt(seconds)}</div>
      </div>
      <button onClick={()=>stopRec(seconds)} style={{ width:44, height:44, borderRadius:"50%", background:C.accent, border:"none", cursor:"pointer", color:"#fff", fontSize:18 }}>✓</button>
      <button onClick={()=>{clearInterval(timerRef.current);setRecording(false);setSeconds(0);}} style={{ width:44, height:44, borderRadius:"50%", background:"rgba(255,255,255,0.08)", border:"1px solid "+(C.border), cursor:"pointer", color:C.textDim, fontSize:16 }}>✕</button>
    </div>
  );
  return (
    <div style={{ padding:"10px 16px", borderTop:"1px solid "+(C.border), display:"flex", gap:8, alignItems:"flex-end" }}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ const f=e.target.files[0]; if(f){onPhotoSend(URL.createObjectURL(f));} e.target.value=""; }}/>
      <button onClick={()=>fileRef.current?.click()} style={{ width:40, height:40, borderRadius:"50%", background:"none", border:"1px solid "+(C.border), cursor:"pointer", color:C.textDim, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4"/><circle cx="8" cy="8" r="2.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4"/></svg>
      </button>
      <div style={{ flex:1, padding:"10px 14px", background:C.surface, borderRadius:24, border:"1px solid "+(C.border) }}>
        <textarea value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder} rows={1} style={{ width:"100%", background:"none", border:"none", color:C.text, fontFamily:DM, fontSize:14, outline:"none", resize:"none", lineHeight:1.4 }}/>
      </div>
      {value.trim()
        ? <button onClick={onSend} style={{ width:40, height:40, borderRadius:"50%", background:C.accent, border:"none", cursor:"pointer", color:"#fff", fontSize:18, flexShrink:0 }}>↑</button>
        : <button onMouseDown={startRec} onTouchStart={startRec} style={{ width:40, height:40, borderRadius:"50%", background:"none", border:"1px solid "+(C.border), cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="11" rx="3" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none"/>
              <path d="M5 10 C5 14.4 8.1 18 12 18 C15.9 18 19 14.4 19 10" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              <line x1="12" y1="18" x2="12" y2="22" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="8" y1="22" x2="16" y2="22" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
      }
    </div>
  );
}

// ── Person Profile View ────────────────────────────────────────────────────────

// ── Report & Block Menu ────────────────────────────────────────────────────────
function ReportBlockMenu({ onClose, targetName, targetId, isAnon=false }) {
  const [done, setDone] = useState(null);
  const [showReasons, setShowReasons] = useState(false);
  const reasons = ["Harassment or bullying","Inappropriate content","Spam","Hate speech","Underage user","Something else"];

  const report = (reason) => {
    const subject = encodeURIComponent("Report: " + (isAnon ? "Anonymous post" : targetName));
    const body = encodeURIComponent("I want to report " + (isAnon ? "an anonymous post" : targetName + " (ID: " + targetId + ")") + ".\n\nReason: " + reason + "\n\nPlease investigate.");
    window.open("mailto:support@chins.app?subject=" + subject + "&body=" + body);
    setDone("report");
  };

  const block = () => {
    setDone("block");
  };

  if(done === "report") return (
    <div style={{ padding:"24px", textAlign:"center" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
      <div style={{ fontFamily:"DM Sans", fontSize:16, fontWeight:700, color:"#fff", marginBottom:8 }}>Report sent</div>
      <div style={{ fontFamily:"DM Sans", fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:20, lineHeight:1.6 }}>Thanks for letting us know. We'll look into it within 24 hours.</div>
      <button onClick={onClose} style={{ padding:"12px 24px", borderRadius:14, background:"rgba(255,255,255,0.08)", border:"none", color:"#fff", fontFamily:"DM Sans", cursor:"pointer" }}>Done</button>
    </div>
  );

  if(done === "block") return (
    <div style={{ padding:"24px", textAlign:"center" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>🚫</div>
      <div style={{ fontFamily:"DM Sans", fontSize:16, fontWeight:700, color:"#fff", marginBottom:8 }}>Blocked</div>
      <div style={{ fontFamily:"DM Sans", fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:20, lineHeight:1.6 }}>{isAnon ? "This post" : targetName} has been blocked. You won't see them again.</div>
      <button onClick={onClose} style={{ padding:"12px 24px", borderRadius:14, background:"rgba(255,255,255,0.08)", border:"none", color:"#fff", fontFamily:"DM Sans", cursor:"pointer" }}>Done</button>
    </div>
  );

  if(showReasons) return (
    <div style={{ padding:"20px" }}>
      <div style={{ fontFamily:"DM Sans", fontSize:16, fontWeight:700, color:"#fff", marginBottom:16 }}>Why are you reporting this?</div>
      {reasons.map(r => (
        <button key={r} onClick={()=>report(r)} style={{ width:"100%", padding:"14px 16px", marginBottom:8, borderRadius:14, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", color:"#fff", fontFamily:"DM Sans", fontSize:14, cursor:"pointer", textAlign:"left" }}>{r}</button>
      ))}
      <button onClick={()=>setShowReasons(false)} style={{ width:"100%", padding:"12px", borderRadius:14, background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontFamily:"DM Sans", cursor:"pointer", marginTop:4 }}>Cancel</button>
    </div>
  );

  return (
    <div style={{ padding:"20px" }}>
      <div style={{ fontFamily:"DM Sans", fontSize:16, fontWeight:700, color:"#fff", marginBottom:4 }}>{isAnon ? "Anonymous post" : targetName}</div>
      <div style={{ fontFamily:"DM Sans", fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:20 }}>What would you like to do?</div>
      <button onClick={()=>setShowReasons(true)} style={{ width:"100%", padding:"14px 16px", marginBottom:10, borderRadius:14, background:"rgba(224,82,82,0.1)", border:"1px solid rgba(224,82,82,0.2)", color:"#E05252", fontFamily:"DM Sans", fontSize:14, fontWeight:600, cursor:"pointer", textAlign:"left" }}>🚩 Report {isAnon ? "this post" : targetName}</button>
      {!isAnon && <button onClick={block} style={{ width:"100%", padding:"14px 16px", marginBottom:10, borderRadius:14, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.7)", fontFamily:"DM Sans", fontSize:14, cursor:"pointer", textAlign:"left" }}>🚫 Block {targetName}</button>}
      <button onClick={onClose} style={{ width:"100%", padding:"12px", borderRadius:14, background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontFamily:"DM Sans", cursor:"pointer", marginTop:4 }}>Cancel</button>
    </div>
  );
}

// ── Modal Wrapper ──────────────────────────────────────────────────────────────
function ReportModal({ onClose, targetName, targetId, isAnon=false }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:999, display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={onClose}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)" }}/>
      <div style={{ position:"relative", width:"100%", maxWidth:480, background:"#1a2e2a", borderRadius:"24px 24px 0 0", paddingBottom:32, zIndex:1 }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, borderRadius:2, background:"rgba(255,255,255,0.2)", margin:"12px auto 4px" }}/>
        <ReportBlockMenu onClose={onClose} targetName={targetName} targetId={targetId} isAnon={isAnon}/>
      </div>
    </div>
  );
}

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
  const [showReport, setShowReport] = useState(false);
  const endRef = useRef(null);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[chatMsgs]);

  useEffect(()=>{
    (async()=>{
      try { const text=await callAI("You are Reed on Chins. User wants to know about connecting with "+(person.alias)+". Their interests: "+(person.interests.join(", "))+". Vibe: \""+(person.vibe)+"\". Say something short and personal — like a friend whispering \"psst\" — pointing out why they should connect. 1-2 sentences.",null,100); setAskText(text); }
      catch { setAskText((person.alias)+" seems like someone worth a conversation."); }
      setAskLoading(false);
    })();
  },[]);

  const addAgentMsg=(role,text,delay=0)=>new Promise(res=>setTimeout(()=>{setAgentMsgs(prev=>[...prev,{role,text}]);res();},delay));

  const handleYes=async()=>{
    setPhase("syncing");
    try {
      await addAgentMsg("reed","Quick sync re: "+(person.alias)+"?",0);
      await addAgentMsg("them",(person.alias)+"'s agent here — go ahead.",1200);
      const report=await callAI("You are "+(person.alias)+"'s AI agent on Chins. Reply as their agent about compatibility in 2-3 short natural sentences.",null,150);
      const lines=report.split(/\n+/).filter(l=>l.trim().length>8).slice(0,3);
      if(lines[0]) await addAgentMsg("them",lines[0],800);
      if(lines[1]) await addAgentMsg("reed",lines[1],1000);
      if(lines[2]) await addAgentMsg("them",lines[2],900);
      await addAgentMsg("reed","Got it — looping back to my user. 💚",700);
      await new Promise(r=>setTimeout(r,500));
      const summary=await callAI("You are Reed. You just synced with "+(person.alias)+"'s agent. Tell the user your honest read in 1-2 warm sentences.",null,100);
      setSyncResult(summary);
    } catch { setSyncResult("My gut says go for it."); }
    setPhase("result");
  };

  const handleConnect=async()=>{
    setPhase("connecting");
    try { const opener=await callAI("You are Reed. Write one warm opener for the user to send to "+(person.alias)+". 1-2 sentences. Start with \"Hey "+(person.alias)+",\"",null,100); setChatMsgs([{sender:"reed-sent",text:opener}]); }
    catch { setChatMsgs([{sender:"reed-sent",text:"Hey "+(person.alias)+", Reed thought we'd get along — seems right to me."}]); }
    setConnected(true); onConnect(person);
  };

  const sendChat=()=>{ if(!chatInput.trim()) return; setChatMsgs(prev=>[...prev,{sender:"me",text:chatInput.trim()}]); setChatInput(""); };

  if(connected) return (
    <div style={{ position:"absolute", inset:0, background:C.bg, zIndex:200, display:"flex", flexDirection:"column" }}>
      {showReport && <ReportModal onClose={()=>setShowReport(false)} targetName={person.alias} targetId={person.id}/>}
      <div style={{ padding:"16px 20px", borderBottom:"1px solid "+(C.border), display:"flex", alignItems:"center", gap:12, background:C.surface }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:C.text, fontSize:20, cursor:"pointer" }}>←</button>
        <div style={{ width:36, height:36, borderRadius:"50%", overflow:"hidden", background:person.gradient }}>
          <img src={personPhoto(person.id,72)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.style.display="none";}}/>
        </div>
        <div style={{ flex:1 }}><div style={{ fontWeight:600, color:C.text, fontFamily:DM }}>{person.alias}</div><div style={{ fontSize:11, color:C.accent, fontFamily:DM }}>● Active now</div></div>
        <button onClick={()=>setShowReport(true)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontSize:20, cursor:"pointer", padding:"4px 8px" }}>⋯</button>
      </div>
      {nudge&&<div style={{ margin:"12px 16px 0", padding:"10px 14px", background:C.accentDim, borderRadius:14, border:"1px solid "+(C.accentGlow), display:"flex", gap:10 }}><ReedAvatar size={22}/><div style={{ fontSize:12, color:C.accent, lineHeight:1.6, fontFamily:DM }}>{nudge}</div></div>}
      <div style={{ flex:1, overflowY:"auto", padding:"12px 16px" }}>
        {chatMsgs.map((m,i)=>(
          <div key={i} style={{ marginBottom:10 }}>
            {m.sender==="reed-sent"&&<div style={{ display:"flex", gap:8, alignItems:"flex-end" }}><ReedAvatar size={28}/><div style={{ maxWidth:"75%", padding:"10px 14px", background:C.surface, borderRadius:"16px 16px 16px 4px", color:C.text, fontSize:14, border:"1px solid "+(C.border), fontFamily:DM }}>{m.text}</div></div>}
            {m.sender==="me"&&<div style={{ display:"flex", justifyContent:"flex-end" }}><div style={{ maxWidth:"75%", padding:"10px 14px", background:C.accent, borderRadius:"16px 16px 4px 16px", color:"#fff", fontSize:14, fontFamily:DM }}>{m.text}</div></div>}
            {m.type==="voice"&&<div style={{ display:"flex", justifyContent:"flex-end" }}><VoiceNotePlayer duration={m.duration} isMe={true}/></div>}
            {m.type==="photo"&&<div style={{ display:"flex", justifyContent:"flex-end" }}><img src={m.url} style={{ maxWidth:180, borderRadius:14 }} alt=""/></div>}
          </div>
        ))}
        <div ref={endRef}/>
      </div>
      <ChatInputBar placeholder={"Message "+(person.alias)+"…"} value={chatInput} onChange={e=>setChatInput(e.target.value)} onSend={sendChat} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();}}} onVoiceSend={dur=>setChatMsgs(prev=>[...prev,{sender:"me",type:"voice",duration:dur}])} onPhotoSend={url=>setChatMsgs(prev=>[...prev,{sender:"me",type:"photo",url}])}/>
    </div>
  );

  return (
    <div style={{ position:"absolute", inset:0, background:C.bg, zIndex:100, overflowY:"auto" }}>
      {showReport && <ReportModal onClose={()=>setShowReport(false)} targetName={person.alias} targetId={person.id}/>}
      <div style={{ height:240, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:person.gradient }}/>
        <img src={personPhoto(person.id,400)} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", mixBlendMode:"overlay", opacity:0.5 }} onError={e=>{e.target.style.display="none";}}/>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(5,74,67,0.9) 100%)" }}/>
        <button onClick={onBack} style={{ position:"absolute", top:16, left:16, background:"rgba(0,0,0,0.35)", border:"none", color:"#fff", width:36, height:36, borderRadius:"50%", cursor:"pointer", fontSize:18 }}>←</button>
        <button onClick={()=>setShowReport(true)} style={{ position:"absolute", top:16, right:16, background:"rgba(0,0,0,0.35)", border:"none", color:"#fff", width:36, height:36, borderRadius:"50%", cursor:"pointer", fontSize:16 }}>⋯</button>
        <div style={{ position:"absolute", bottom:20, left:20 }}>
          <div style={{ fontFamily:DM, fontSize:24, fontWeight:700, color:"#fff" }}>{person.alias}</div>
          {person.vibe&&<div style={{ fontSize:13, color:"rgba(255,255,255,0.75)", marginTop:3, fontStyle:"italic", fontFamily:DM }}>"{person.vibe}"</div>}
        </div>
      </div>
      <div style={{ padding:"20px" }}>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
          {person.interests.map(i=><span key={i} style={{ padding:"6px 14px", borderRadius:20, background:C.accentDim, border:"1px solid "+(C.accentGlow), color:C.accent, fontSize:13, fontFamily:DM }}>{i}</span>)}
        </div>
        <div style={{ background:C.surface, borderRadius:20, border:"1px solid "+(C.border), overflow:"hidden" }}>
          <div style={{ padding:"14px 16px", borderBottom:"1px solid "+(C.border), display:"flex", gap:10, alignItems:"center" }}>
            <ReedAvatar size={28}/><div style={{ fontSize:13, fontWeight:600, color:C.text, fontFamily:DM }}>Reed</div>
          </div>
          <div style={{ padding:"14px 16px" }}>
            {phase==="ask"&&(askLoading?<Dots/>:<><div style={{ fontSize:14, color:C.text, lineHeight:1.6, marginBottom:14, fontFamily:DM }}>{askText}</div><div style={{ display:"flex", gap:8 }}><button onClick={handleYes} style={{ flex:1, padding:"10px", borderRadius:12, background:C.accent, border:"none", color:"#fff", cursor:"pointer", fontWeight:600, fontFamily:DM, fontSize:13 }}>Check with their agent</button><button onClick={handleConnect} style={{ flex:1, padding:"10px", borderRadius:12, background:C.surface, border:"1px solid "+(C.border), color:C.text, cursor:"pointer", fontFamily:DM, fontSize:13 }}>Connect directly</button></div></>)}
            {phase==="syncing"&&<div>{agentMsgs.map((m,i)=><div key={i} style={{ marginBottom:8, display:"flex", justifyContent:m.role==="reed"?"flex-start":"flex-end" }}><div style={{ maxWidth:"80%", padding:"8px 12px", borderRadius:12, background:m.role==="reed"?C.accentDim:"rgba(75,193,160,0.25)", color:C.text, fontSize:13, fontFamily:DM }}>{m.text}</div></div>)}{agentMsgs.length<3&&<Dots/>}</div>}
            {phase==="result"&&<><div style={{ fontSize:14, color:C.text, lineHeight:1.6, marginBottom:14, fontFamily:DM }}>{syncResult}</div><button onClick={handleConnect} style={{ width:"100%", padding:"12px", borderRadius:14, background:C.accent, border:"none", color:"#fff", cursor:"pointer", fontWeight:600, fontSize:15, fontFamily:DM }}>Connect with {person.alias} →</button></>}
            {phase==="connecting"&&<div style={{ color:C.accent, textAlign:"center", fontFamily:DM }}>Connecting…</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Matching Algorithm ────────────────────────────────────────────────────────
function matchScore(userA, userB) {
  if(!userA || !userB) return 0;
  let score = 0;
  const reasons = [];

  // Energy compatibility (25 points)
  // Same energy = good, opposite = depends on social goal
  const energyMap = { calm:0, balanced:1, high:2 };
  const eA = energyMap[userA.energy] ?? 1;
  const eB = energyMap[userB.energy] ?? 1;
  const energyDiff = Math.abs(eA - eB);
  if(energyDiff === 0) { score += 25; reasons.push("same energy"); }
  else if(energyDiff === 1) { score += 15; }
  else { score += 5; } // opposite energy — lower but not zero

  // Depth compatibility (20 points)
  // Matching depth matters a lot — a deep person with surface person = frustration
  const depthMap = { surface:0, medium:1, deep:2 };
  const dA = depthMap[userA.depth] ?? 1;
  const dB = depthMap[userB.depth] ?? 1;
  const depthDiff = Math.abs(dA - dB);
  if(depthDiff === 0) { score += 20; reasons.push("connect on the same level"); }
  else if(depthDiff === 1) { score += 10; }
  else { score += 0; }

  // Social goal alignment (20 points)
  const goalCompat = {
    "activity-partner": ["activity-partner", "social-circle", "open"],
    "confidant": ["confidant", "ride-or-die", "open"],
    "social-circle": ["social-circle", "activity-partner", "open"],
    "ride-or-die": ["ride-or-die", "confidant", "open"],
    "open": ["activity-partner","confidant","social-circle","ride-or-die","open"],
  };
  const gA = userA.socialGoal || "open";
  const gB = userB.socialGoal || "open";
  if(gA === gB) { score += 20; reasons.push("looking for the same thing"); }
  else if(goalCompat[gA]?.includes(gB)) { score += 12; }
  else { score += 3; }

  // Life stage (15 points)
  // People in similar life stages tend to connect better
  if(userA.lifeStage && userB.lifeStage && userA.lifeStage === userB.lifeStage) {
    score += 15;
    reasons.push("at a similar point in life");
  } else { score += 5; }

  // Communication style (10 points)
  const commCompat = {
    "constant-texter": ["constant-texter", "banter", "mixed"],
    "slow-burner": ["slow-burner", "real-talk", "mixed"],
    "banter": ["banter", "constant-texter", "playful", "mixed"],
    "real-talk": ["real-talk", "slow-burner", "mixed"],
    "mixed": ["constant-texter","slow-burner","banter","real-talk","mixed"],
  };
  const cA = userA.commStyle || "mixed";
  const cB = userB.commStyle || "mixed";
  if(cA === cB) { score += 10; }
  else if(commCompat[cA]?.includes(cB)) { score += 6; }

  // Humour compatibility (10 points)
  const humourCompat = {
    "dry": ["dry", "dark", "mixed"],
    "warm": ["warm", "playful", "earnest", "mixed"],
    "playful": ["playful", "warm", "mixed"],
    "dark": ["dark", "dry", "mixed"],
    "earnest": ["earnest", "warm", "mixed"],
    "mixed": ["dry","warm","playful","dark","earnest","mixed"],
  };
  const hA = userA.humour || "mixed";
  const hB = userB.humour || "mixed";
  if(hA === hB) { score += 10; reasons.push("same sense of humour"); }
  else if(humourCompat[hA]?.includes(hB)) { score += 6; }

  return { score, reasons };
}

function matchReason(userA, userB) {
  // Generate a human-readable reason Reed would give for this match
  const { score, reasons } = matchScore(userA, userB);
  if(score >= 70) return `Reed thinks you'd just click — ${reasons.slice(0,2).join(" and ")}.`;
  if(score >= 50) return `Something about ${userB.display_name||"this person"} feels right for you — ${reasons[0] || "Reed has a feeling about this one"}.`;
  return `Outside your usual — Reed thinks you'd surprise each other.`;
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
    if (isAnimating || matchDone.current || NEARBY.length === 0) return;
    matchDone.current = true;
    setIsAnimating(true);
    setReedMood("thinking");
    setReedBubble({ text:"give me a sec…", type:"thinking" });
    await new Promise(r=>setTimeout(r,1500));
    try {
      // Sort by match score and pick best
      const scored = NEARBY.map(p => ({ ...p, matchResult: matchScore(userProfile, p) }))
        .sort((a,b) => b.matchResult.score - a.matchResult.score);
      const person = scored[0];
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
      setReedBubble({ text:matchReason(userProfile, person), type:"match", person });
    } catch {
      const p = NEARBY[0];
      setMatchTarget(p);
      setReedMood("excited");
      setReedBubble({ text:"okay — "+(p.alias)+" has your energy. just saying.", type:"match", person:p });
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

      <div style={{ padding:"18px 20px 10px", borderBottom:"1px solid "+(C.border), flexShrink:0 }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:22, fontWeight:700, color:C.text }}>Connect</div>
        <div style={{ fontSize:12, color:C.textDim, marginTop:2, fontFamily:DM }}>
          {isPrivate ? "Private mode — Reed is working for you" : "People nearby who might just become your people"}
        </div>
      </div>

      {/* First time welcome banner */}
      {!isPrivate && connectionCount === 0 && userProfile && (
        <div style={{ margin:"12px 16px 0", padding:"14px 16px", background:"rgba(75,193,160,0.12)", borderRadius:16, border:"1px solid rgba(75,193,160,0.25)", flexShrink:0 }}>
          <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
            <img src={REED_IMG} style={{ width:22, height:22, borderRadius:"50%", objectFit:"cover", objectPosition:"center top", flexShrink:0, display:"block" }} alt="Reed"/>
            <div>
              <div style={{ fontFamily:DM, fontSize:13, fontWeight:700, color:C.accent, marginBottom:3 }}>You made it!</div>
              <div style={{ fontFamily:DM, fontSize:12, color:"rgba(255,255,255,0.6)", lineHeight:1.6 }}>These are people nearby I think you might click with. Tap anyone to find out why.</div>
            </div>
          </div>
        </div>
      )}

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
        // Discoverable mode — show real users or empty state
        <div style={{ flex:1, overflowY:"auto", padding:"12px 14px 120px" }}>
          {NEARBY.length === 0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 32px", textAlign:"center" }}>
              <div style={{ fontSize:52, marginBottom:20 }}>🌱</div>
              <div style={{ fontFamily:DM, fontSize:18, fontWeight:700, color:C.text, marginBottom:12 }}>You're one of the first</div>
              <div style={{ fontFamily:DM, fontSize:14, color:C.textSub, lineHeight:1.7, marginBottom:28 }}>
                Chins is just getting started. Reed is out there finding your people — share the app and help them find their way here.
              </div>
              <button onClick={()=>{ if(navigator.share){ navigator.share({ title:'chins', text:'Found this app — thought of you', url:'https://chins.app' }); }}} style={{ padding:"13px 24px", borderRadius:16, background:C.accent, border:"none", color:"#fff", fontFamily:DM, fontSize:15, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 20px rgba(75,193,160,0.35)" }}>
                Invite someone →
              </button>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
              {NEARBY.map((p,i) => {
                const isTarget = matchTarget?.id===p.id;
                return (
                  <div key={p.id} ref={el=>tileRefs.current[p.id]=el} onClick={()=>setOpenedPerson(p)} style={{ borderRadius:20, overflow:"hidden", cursor:"pointer", background:C.surface, border:"1.5px solid "+(isTarget?C.accent:C.border), boxShadow:isTarget?"0 0 18px "+(C.accentGlow):"0 4px 16px rgba(0,0,0,0.2)", transition:"border-color 0.3s,box-shadow 0.3s" }}>
                    <div style={{ height:88, background:p.gradient, position:"relative", overflow:"hidden" }}>
                      <img src={personPhoto(p.id)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.style.display="none";}}/>
                      {isTarget&&<div style={{ position:"absolute", inset:0, border:"2px solid "+(C.accent), borderRadius:18, animation:"targetPulse 1s ease-in-out infinite" }}/>}
                    </div>
                    <div style={{ padding:"8px 9px 10px" }}>
                      <div style={{ fontFamily:DM, fontSize:12, fontWeight:700, color:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.alias}</div>
                      <div style={{ fontSize:10, color:C.textSub, lineHeight:1.4, marginTop:3, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{p.vibe}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
              <div style={{ position:"absolute", bottom:-6, left:"50%", transform:"translateX(-50%)", width:0, height:0, borderLeft:"6px solid transparent", borderRight:"6px solid transparent", borderTop:"6px solid "+(reedBubble.type==="match"?C.accent:C.surfaceUp) }}/>
            </div>
          )}
          <img src={REED_IMG} style={{ width:52, height:52, borderRadius:"50%", objectFit:"cover", objectPosition:"center top", display:"block", boxShadow:"0 4px 16px rgba(75,193,160,0.3)" }} alt="Reed"/>
        </div>
      )}
    </div>
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
      <div style={{ padding:"16px 20px", borderBottom:"1px solid "+(C.border), display:"flex", alignItems:"center", gap:12, background:C.surface }}>
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
            {m.sender==="reed-nudge"&&<div style={{ display:"flex",gap:8,alignItems:"flex-start",margin:"8px 0" }}><ReedAvatar size={22} animal={chipAnimal}/><div style={{ fontSize:12,color:C.accent,background:C.accentDim,padding:"8px 12px",borderRadius:12,border:"1px solid "+(C.accentGlow),lineHeight:1.5,fontFamily:DM }}>{m.text}</div></div>}
            {m.sender==="me"&&!m.type&&<div style={{ display:"flex",justifyContent:"flex-end" }}><div style={{ maxWidth:"75%",padding:"10px 14px",background:C.accent,borderRadius:"16px 16px 4px 16px",color:"#fff",fontSize:14,fontFamily:DM }}>{m.text}</div></div>}
            {m.sender==="me"&&m.type==="voice"&&<div style={{ display:"flex",justifyContent:"flex-end" }}><VoiceNotePlayer duration={m.duration} isMe={true}/></div>}
            {m.sender==="me"&&m.type==="photo"&&<div style={{ display:"flex",justifyContent:"flex-end" }}><img src={m.url} style={{ maxWidth:180,borderRadius:14 }} alt=""/></div>}
            {m.sender==="them"&&<div style={{ display:"flex",gap:8,alignItems:"flex-end" }}>
              <div style={{ width:28,height:28,borderRadius:"50%",overflow:"hidden",background:openChat.gradient,flexShrink:0 }}><img src={personPhoto(openChat.personId,56)} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} onError={e=>{e.target.style.display="none";}}/></div>
              <div style={{ maxWidth:"75%",padding:"10px 14px",background:C.surface,borderRadius:"16px 16px 16px 4px",color:C.text,fontSize:14,border:"1px solid "+(C.border),fontFamily:DM }}>{m.text}</div>
            </div>}
          </div>
        ))}
        <div ref={endRef}/>
      </div>
      <ChatInputBar placeholder={"Message "+(openChat.alias||openChat.name)+"…"} value={chatInput} onChange={e=>setChatInput(e.target.value)} onSend={sendMsg} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}}} onVoiceSend={dur=>setChatMsgs(prev=>[...prev,{sender:"me",type:"voice",duration:dur}])} onPhotoSend={url=>setChatMsgs(prev=>[...prev,{sender:"me",type:"photo",url}])}/>
    </div>
  );

  if(openGroup) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:C.bg }}>
      <div style={{ padding:"16px 20px", borderBottom:"1px solid "+(C.border), display:"flex", alignItems:"center", gap:12, background:C.surface }}>
        <button onClick={()=>{setOpenGroup(null);setGroupMsgs([]);}} style={{ background:"none",border:"none",color:C.text,fontSize:20,cursor:"pointer" }}>←</button>
        <div style={{ width:36,height:36,borderRadius:"50%",background:openGroup.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>{openGroup.emoji}</div>
        <div><div style={{ fontWeight:600,color:C.text,fontFamily:DM }}>{openGroup.name}</div><div style={{ fontSize:11,color:C.textDim,fontFamily:DM }}>{openGroup.memberCount} members</div></div>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:"12px 16px" }}>
        <div style={{ textAlign:"center",fontSize:11,color:C.textDim,margin:"4px 0 14px",fontFamily:DM }}>Today</div>
        <div style={{ display:"flex",gap:8,alignItems:"flex-end",marginBottom:10 }}><div style={{ width:28,height:28,borderRadius:"50%",background:openGroup.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>{openGroup.emoji}</div><div style={{ maxWidth:"75%",padding:"10px 14px",background:C.surface,borderRadius:"16px 16px 16px 4px",color:C.text,fontSize:14,border:"1px solid "+(C.border),fontFamily:DM }}>{openGroup.lastMsg}</div></div>
        {groupMsgs.map((m,i)=><div key={i} style={{ marginBottom:8 }}>{m.sender==="me"?<div style={{ display:"flex",justifyContent:"flex-end" }}><div style={{ maxWidth:"75%",padding:"10px 14px",background:C.accent,borderRadius:"16px 16px 4px 16px",color:"#fff",fontSize:14,fontFamily:DM }}>{m.text}</div></div>:<div style={{ display:"flex",gap:8,alignItems:"flex-end" }}><div style={{ width:28,height:28,borderRadius:"50%",background:openGroup.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>{openGroup.emoji}</div><div style={{ maxWidth:"75%",padding:"10px 14px",background:C.surface,borderRadius:"16px 16px 16px 4px",color:C.text,fontSize:14,border:"1px solid "+(C.border),fontFamily:DM }}>{m.text}</div></div>}</div>)}
        <div ref={grpEndRef}/>
      </div>
      <div style={{ padding:"10px 16px",borderTop:"1px solid "+(C.border),display:"flex",gap:8 }}>
        <textarea value={groupInput} onChange={e=>setGroupInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendGroupMsg();}}} placeholder="Message the group…" rows={1} style={{ flex:1,padding:"11px 14px",borderRadius:22,border:"1px solid "+(C.border),background:C.surface,color:C.text,resize:"none",fontFamily:DM,fontSize:14,outline:"none" }}/>
        <button onClick={sendGroupMsg} disabled={!groupInput.trim()} style={{ width:42,height:42,borderRadius:"50%",background:groupInput.trim()?C.accent:"rgba(255,255,255,0.1)",border:"none",cursor:"pointer",color:"#fff",fontSize:18 }}>↑</button>
      </div>
    </div>
  );

  const totalUnread = MOCK_CHATS.reduce((a,c)=>a+(c.unread||0),0);
  const groupUnread = myGroups.reduce((a,g)=>a+(g.unread||0),0);

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",background:C.bg,overflow:"hidden" }}>
      <div style={{ padding:"18px 20px 12px",borderBottom:"1px solid "+(C.border) }}>
        <div style={{ fontFamily:DM,fontSize:22,fontWeight:700,color:C.text }}>Chats</div>
      </div>
      <div style={{ display:"flex",borderBottom:"1px solid "+(C.border),background:C.surface }}>
        {[{id:"people",label:"People",count:totalUnread},{id:"groups",label:"Groups",count:groupUnread}].map(t=>(
          <button key={t.id} onClick={()=>setSubTab(t.id)} style={{ flex:1,padding:"12px 0",background:"none",border:"none",borderBottom:"2px solid "+(subTab===t.id?C.accent:"transparent"),color:subTab===t.id?C.accent:C.textDim,cursor:"pointer",fontFamily:DM,fontSize:14,fontWeight:subTab===t.id?600:400,display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
            {t.label}{t.count>0&&<span style={{ minWidth:16,height:16,borderRadius:8,padding:"0 4px",background:C.accent,color:"#fff",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700 }}>{t.count}</span>}
          </button>
        ))}
      </div>
      <div style={{ flex:1,overflowY:"auto" }}>
        {subTab==="people"&&MOCK_CHATS.map(chat=>(
          <div key={chat.id} onClick={()=>openChatWith(chat)} style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:"1px solid "+(C.border),cursor:"pointer" }}>
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
                <div key={g.id} onClick={()=>setOpenGroup(g)} style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:"1px solid "+(C.border),cursor:"pointer" }}>
                  <div style={{ width:48,height:48,borderRadius:"50%",background:g.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>{g.emoji}</div>
                  <div style={{ flex:1,minWidth:0 }}><div style={{ fontWeight:600,color:C.text,fontFamily:DM }}>{g.name}</div><div style={{ fontSize:13,color:C.textDim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:DM }}>{g.lastMsg}</div></div>
                  <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6 }}><div style={{ fontSize:11,color:C.textDim,fontFamily:DM }}>{g.time}</div>{g.unread>0&&<div style={{ width:20,height:20,borderRadius:"50%",background:C.accent,color:"#fff",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700 }}>{g.unread}</div>}</div>
                </div>
              ))}
            </>}
            {suggestions.length>0&&<>
              <div style={{ padding:"16px 16px 8px",fontSize:11,fontWeight:600,color:C.textDim,textTransform:"uppercase",letterSpacing:0.5,fontFamily:DM }}>Reed suggests</div>
              {suggestions.map(g=>(
                <div key={g.id} style={{ margin:"0 16px 12px",borderRadius:18,border:"1px solid "+(C.border),overflow:"hidden",background:C.surface }}>
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
                      <button onClick={()=>setSuggestions(prev=>prev.filter(x=>x.id!==g.id))} style={{ padding:"9px 14px",borderRadius:12,background:"none",border:"1px solid "+(C.border),color:C.textDim,cursor:"pointer",fontSize:13,fontFamily:DM }}>Pass</button>
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
  const [showCompose, setShowCompose] = useState(false);
  const [newPlan, setNewPlan] = useState({ title:"", location:"", date:"", emoji:"📅", note:"", photo:null });
  const planPhotoRef = useRef(null);

  useEffect(()=>{
    (async()=>{
      try { const text=await callAI("You are Reed on Chins. Write a warm 2-sentence weekly digest. Mention 1 specific event and 1 person. User: "+(JSON.stringify(userProfile||{name:"you"}))+". Events: "+(JSON.stringify(EVENTS.slice(0,3).map(e=>({title:e.title,date:e.date})))),null,120); setWeeklyDigest(text); }
      catch { setWeeklyDigest("There's a board game night Friday and a parkrun Saturday — both worth showing up to."); }
      setDigestLoading(false);
    })();
  },[]);

  const filtered = category==="all"?events:events.filter(e=>e.time===category);
  const toggleGoing = (id) => setEvents(prev=>prev.map(e=>e.id===id?{...e,going:!e.going}:e));

  const addPlan = () => {
    if(!newPlan.title.trim()) return;
    const plan = {
      id: Date.now(),
      title: newPlan.title.trim(),
      location: newPlan.location.trim() || "Location TBC",
      date: newPlan.date || "Date TBC",
      clock: "",
      emoji: newPlan.emoji || "📅",
      tags: [],
      going: true,
      time: "upcoming",
      who: [],
      photo: newPlan.photo || null,
      reedNote: newPlan.note.trim() || null,
    };
    setEvents(prev=>[plan, ...prev]);
    setNewPlan({ title:"", location:"", date:"", emoji:"📅", note:"", photo:null });
    setShowCompose(false);
  };

  const emojis = ["📅","🎉","🏃","🎲","☕","🍕","🎵","🥾","🎨","🏋️","🎭","🍺"];

  if(showCompose) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:C.bg, overflow:"hidden" }}>
      <div style={{ padding:"16px 20px 12px", borderBottom:"1px solid "+(C.border), display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
        <button onClick={()=>setShowCompose(false)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.5)", fontSize:20, cursor:"pointer" }}>←</button>
        <div style={{ fontFamily:DM, fontSize:17, fontWeight:700, color:C.text }}>New plan</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"20px 20px 0" }}>

        {/* Photo upload */}
        <input ref={planPhotoRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ const f=e.target.files[0]; if(f) setNewPlan(p=>({...p,photo:URL.createObjectURL(f)})); e.target.value=""; }}/>
        <div onClick={()=>planPhotoRef.current?.click()} style={{ width:"100%", height:160, borderRadius:16, border:"1.5px dashed rgba(255,255,255,0.2)", background:newPlan.photo?"none":"rgba(255,255,255,0.03)", marginBottom:16, cursor:"pointer", overflow:"hidden", position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {newPlan.photo ? (
            <>
              <img src={newPlan.photo} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt=""/>
              <button onClick={e=>{ e.stopPropagation(); setNewPlan(p=>({...p,photo:null})); }} style={{ position:"absolute", top:8, right:8, width:28, height:28, borderRadius:"50%", background:"rgba(0,0,0,0.5)", border:"none", color:"#fff", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
            </>
          ) : (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>📷</div>
              <div style={{ fontFamily:DM, fontSize:13, color:"rgba(255,255,255,0.4)" }}>Add a photo</div>
              <div style={{ fontFamily:DM, fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:4 }}>optional</div>
            </div>
          )}
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontFamily:DM, fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>What's the plan?</div>
          <input value={newPlan.title} onChange={e=>setNewPlan(p=>({...p,title:e.target.value}))} placeholder="e.g. Board game night" style={{ width:"100%", padding:"14px 16px", borderRadius:14, border:"1.5px solid rgba(255,255,255,0.14)", background:"rgba(255,255,255,0.05)", color:"#fff", fontFamily:DM, fontSize:15, outline:"none", boxSizing:"border-box" }}/>
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontFamily:DM, fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>Where?</div>
          <input value={newPlan.location} onChange={e=>setNewPlan(p=>({...p,location:e.target.value}))} placeholder="Location" style={{ width:"100%", padding:"14px 16px", borderRadius:14, border:"1.5px solid rgba(255,255,255,0.14)", background:"rgba(255,255,255,0.05)", color:"#fff", fontFamily:DM, fontSize:15, outline:"none", boxSizing:"border-box" }}/>
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontFamily:DM, fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>When?</div>
          <input value={newPlan.date} onChange={e=>setNewPlan(p=>({...p,date:e.target.value}))} placeholder="e.g. Friday 7pm" style={{ width:"100%", padding:"14px 16px", borderRadius:14, border:"1.5px solid rgba(255,255,255,0.14)", background:"rgba(255,255,255,0.05)", color:"#fff", fontFamily:DM, fontSize:15, outline:"none", boxSizing:"border-box" }}/>
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontFamily:DM, fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>Pick an emoji</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {emojis.map(e=>(
              <button key={e} onClick={()=>setNewPlan(p=>({...p,emoji:e}))} style={{ width:44, height:44, borderRadius:12, border:"1.5px solid "+(newPlan.emoji===e?C.accent:"rgba(255,255,255,0.12)"), background:newPlan.emoji===e?C.accentDim:"rgba(255,255,255,0.04)", fontSize:22, cursor:"pointer" }}>{e}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontFamily:DM, fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>Add a note (optional)</div>
          <textarea value={newPlan.note} onChange={e=>setNewPlan(p=>({...p,note:e.target.value}))} placeholder="Any extra details..." rows={3} style={{ width:"100%", padding:"14px 16px", borderRadius:14, border:"1.5px solid rgba(255,255,255,0.14)", background:"rgba(255,255,255,0.05)", color:"#fff", fontFamily:DM, fontSize:14, outline:"none", resize:"none", boxSizing:"border-box" }}/>
        </div>
      </div>
      <div style={{ padding:"16px 20px 32px", flexShrink:0 }}>
        <button onClick={addPlan} disabled={!newPlan.title.trim()} style={{ width:"100%", padding:"16px", borderRadius:16, border:"none", background:newPlan.title.trim()?C.accent:"rgba(255,255,255,0.1)", color:"#fff", fontFamily:DM, fontSize:16, fontWeight:700, cursor:newPlan.title.trim()?"pointer":"default", boxShadow:newPlan.title.trim()?"0 6px 24px rgba(75,193,160,0.35)":"none" }}>
          Add plan →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:C.bg, overflow:"hidden" }}>
      <div style={{ padding:"18px 20px 12px", borderBottom:"1px solid "+(C.border), display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontFamily:DM, fontSize:22, fontWeight:700, color:C.text }}>Plans</div>
          <div style={{ fontSize:11, color:C.accent, marginTop:2, fontFamily:DM }}>Things to do — and who you'd meet</div>
        </div>
        <button onClick={()=>setShowCompose(true)} style={{ padding:"9px 16px", borderRadius:20, background:C.accent, border:"none", color:"#fff", fontFamily:DM, fontSize:13, fontWeight:700, cursor:"pointer" }}>
          + New
        </button>
      </div>
      <div style={{ flex:1, overflowY:"auto" }}>
        {showDigest&&<div style={{ margin:"12px 16px 0", padding:"14px", background:C.accentDim, borderRadius:16, border:"1px solid "+(C.accentGlow), display:"flex", gap:10, alignItems:"flex-start" }}>
          <ReedAvatar size={28} animal={chipAnimal}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, fontWeight:600, color:C.accent, textTransform:"uppercase", letterSpacing:0.5, fontFamily:DM }}>Reed's pick this week</div>
            {digestLoading?<Dots/>:<><div style={{ fontSize:13, color:C.text, marginTop:4, lineHeight:1.6, fontFamily:DM }}>{weeklyDigest}</div><button onClick={()=>setShowDigest(false)} style={{ marginTop:8, background:"none", border:"none", color:C.accent, cursor:"pointer", fontSize:12, fontFamily:DM }}>Dismiss</button></>}
          </div>
        </div>}
        <div style={{ display:"flex", gap:8, padding:"12px 16px", overflowX:"auto", scrollbarWidth:"none" }}>
          {EVENT_CATEGORIES.map(c=><button key={c.id} onClick={()=>setCategory(c.id)} style={{ padding:"7px 14px", borderRadius:20, border:"1.5px solid "+(category===c.id?C.accent:C.border), background:category===c.id?C.accentDim:"none", color:category===c.id?C.accent:C.textSub, cursor:"pointer", fontFamily:DM, fontSize:13, whiteSpace:"nowrap", fontWeight:category===c.id?600:400 }}>{c.emoji} {c.label}</button>)}
        </div>
        <div style={{ padding:"0 16px 20px" }}>
          {filtered.map(event=>(
            <div key={event.id} style={{ marginBottom:14, background:"rgba(255,255,255,0.09)", borderRadius:20, border:"1px solid "+(C.border), overflow:"hidden" }}>
              {event.photo&&<img src={event.photo} style={{ width:"100%", height:140, objectFit:"cover", display:"block" }} alt=""/>}
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
                <button onClick={()=>toggleGoing(event.id)} style={{ width:"100%", padding:"11px", borderRadius:14, border:"1.5px solid "+(event.going?C.accent:C.border), background:event.going?C.accentDim:"none", color:event.going?C.accent:C.text, cursor:"pointer", fontWeight:600, fontSize:14, fontFamily:DM }}>{event.going?"✓ I'm going":"count me in →"}</button>
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
    await new Promise(r=>setTimeout(r,1200));
    const available = NEARBY.filter(p=>!passed.includes(p.id));
    if(available.length===0){ setLoading(false); return; }
    const p = available[Math.floor(Math.random()*available.length)];
    setMatch({ person:p, why:p.alias+"'s world is genuinely different from yours — that's the point.", opener:"Hey "+p.alias+" — Reed thinks we'd have an interesting conversation." });
    setLoading(false);
  };
  useEffect(()=>{ findMatch(); },[]);
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:C.bg, overflow:"hidden" }}>
      <div style={{ padding:"18px 20px 12px", borderBottom:"1px solid "+(C.border) }}>
        <div style={{ fontFamily:DM, fontSize:22, fontWeight:700, color:C.text }}>Mingle</div>
        <div style={{ fontSize:11, color:C.accent, marginTop:2, fontFamily:DM }}>Someone outside your usual world</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"20px 16px" }}>
        <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:20 }}>
          <ReedAvatar size={36} animal={chipAnimal}/>
          <div style={{ background:C.surface, border:"1px solid "+(C.border), borderRadius:16, padding:"12px 14px", fontSize:14, color:C.text, lineHeight:1.6, fontFamily:DM }}>
            Not your usual crowd. Someone genuinely different — Reed thinks you'd surprise each other.
          </div>
        </div>
        {loading&&<div style={{ padding:"24px", background:C.surface, borderRadius:24, border:"1px solid "+(C.border), display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}><Dots/><div style={{ fontSize:12, color:C.textSub, fontFamily:DM }}>Reed is thinking outside the box…</div></div>}
        {!loading&&NEARBY.length===0&&(
          <div style={{ textAlign:"center", padding:"40px 24px" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🌍</div>
            <div style={{ fontFamily:DM, fontSize:17, fontWeight:700, color:C.text, marginBottom:8 }}>No one to mingle with yet</div>
            <div style={{ fontFamily:DM, fontSize:14, color:C.textSub, lineHeight:1.7 }}>Reed is on the lookout. Invite some friends to Chins and this will come alive.</div>
          </div>
        )}
        {match&&!loading&&(
          <div style={{ background:"rgba(255,255,255,0.09)", borderRadius:24, border:"1px solid "+(C.border), overflow:"hidden" }}>
            <div style={{ height:140, background:"linear-gradient(135deg,#4BC1A0,#054a43)", position:"relative", display:"flex", alignItems:"flex-end", padding:"0 20px 20px" }}>
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
              <div style={{ display:"flex", gap:8, marginTop:4 }}>
                <button onClick={()=>{ setPassed(prev=>[...prev,match.person.id]); findMatch(); }} style={{ flex:1, padding:"12px", borderRadius:16, border:"1px solid "+(C.border), background:"none", color:C.text, cursor:"pointer", fontSize:14, fontFamily:DM }}>Pass</button>
                <button style={{ flex:2, padding:"12px", borderRadius:16, border:"none", background:C.accent, color:"#fff", cursor:"pointer", fontWeight:600, fontSize:14, fontFamily:DM }}>Say hello →</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SparkScreen({ userProfile, authToken }) {
  const [starters, setStarters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [myStarter, setMyStarter] = useState(null);
  const [newText, setNewText] = useState("");
  const [shareAge, setShareAge] = useState(false);
  const [shareGender, setShareGender] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState([]);
  const [showChatReport, setShowChatReport] = useState(false);
  const [reportingPost, setReportingPost] = useState(null);
  const [posting, setPosting] = useState(false);

  const timeLabel = (created_at) => {
    const hoursLeft = 24 - ((Date.now() - new Date(created_at).getTime()) / (1000*60*60));
    if (hoursLeft <= 0) return "expired";
    if (hoursLeft < 1) return "less than 1h left";
    return Math.floor(hoursLeft) + "h left";
  };

  const fetchStarters = async () => {
    setLoading(true);
    try {
      const cutoff = new Date(Date.now() - 24*60*60*1000).toISOString();
      const r = await fetch(
        SUPABASE_URL + '/rest/v1/starters?created_at=gte.' + cutoff + '&order=created_at.desc&select=*',
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + (authToken||SUPABASE_ANON_KEY) } }
      );
      const data = await r.json();
      if (Array.isArray(data)) {
        const myUserId = userProfile?.id;
        setStarters(data.map(s => ({ ...s, isOwn: s.user_id === myUserId })));
        const mine = data.find(s => s.user_id === myUserId);
        if (mine) setMyStarter({ ...mine, isOwn: true });
        else setMyStarter(null);
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchStarters(); }, []);

  const postStarter = async () => {
    if(!newText.trim() || posting) return;
    setPosting(true);
    try {
      const age = shareAge && userProfile?.dob
        ? Math.floor((new Date() - new Date(userProfile.dob)) / (1000*60*60*24*365.25))
        : null;
      const gender = shareGender && userProfile?.gender ? userProfile.gender : null;
      const r = await fetch(SUPABASE_URL + '/rest/v1/starters', {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + authToken,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: userProfile?.id,
          text: newText.trim(),
          age: age ? String(age) : null,
          gender,
          replies: 0,
        })
      });
      const data = await r.json();
      if (Array.isArray(data) && data[0]) {
        const starter = { ...data[0], isOwn: true };
        setMyStarter(starter);
        setStarters(prev => [starter, ...prev.filter(s => !s.isOwn)]);
      }
      setShowCompose(false);
      setNewText("");
      setShareAge(false);
      setShareGender(false);
    } catch(e) { console.error(e); }
    setPosting(false);
  };

  const removeStarter = async () => {
    if (!myStarter?.id) return;
    try {
      await fetch(SUPABASE_URL + '/rest/v1/starters?id=eq.' + myStarter.id, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + authToken,
        }
      });
    } catch(e) { console.error(e); }
    setStarters(prev => prev.filter(s => s.id !== myStarter.id));
    setMyStarter(null);
  };

  const openChat = (starter) => {
    setActiveChat(starter);
    setChatMsgs([{ role:"them", text: starter.text }]);
  };

  const sendChat = () => {
    if(!chatInput.trim()) return;
    setChatMsgs(prev => [...prev, { role:"me", text:chatInput.trim() }]);
    setChatInput("");
  };

  // Anonymous chat view
  if(activeChat) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#021a16", overflow:"hidden" }}>
      {showChatReport && <ReportModal onClose={()=>setShowChatReport(false)} targetName="Anonymous post" targetId={activeChat.id} isAnon={true}/>}
      <div style={{ padding:"14px 20px 12px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
        <button onClick={()=>setActiveChat(null)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.5)", fontSize:20, cursor:"pointer" }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:DM, fontSize:15, fontWeight:700, color:"#fff" }}>Anonymous chat</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontFamily:DM }}>Your identity is hidden</div>
        </div>
        <div style={{ padding:"4px 10px", borderRadius:20, background:"rgba(75,193,160,0.1)", border:"1px solid rgba(75,193,160,0.2)" }}>
          <span style={{ fontSize:10, color:"#4BC1A0", fontFamily:DM, fontWeight:700 }}>🔒 ANON</span>
        </div>
        <button onClick={()=>setShowChatReport(true)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontSize:20, cursor:"pointer", padding:"4px 8px" }}>⋯</button>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>
        {chatMsgs.map((m,i) => (
          <div key={i} style={{ display:"flex", justifyContent:m.role==="me"?"flex-end":"flex-start", marginBottom:10 }}>
            <div style={{ maxWidth:"75%", padding:"10px 14px", borderRadius:m.role==="me"?"18px 18px 4px 18px":"18px 18px 18px 4px", background:m.role==="me"?"#4BC1A0":"rgba(255,255,255,0.09)", color:"#fff", fontSize:15, lineHeight:1.55, fontFamily:DM }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:"10px 14px 16px", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", gap:10, alignItems:"flex-end", flexShrink:0 }}>
        <textarea value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();}}} placeholder="say something…" rows={1} style={{ flex:1, padding:"11px 16px", borderRadius:24, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.07)", color:"#fff", resize:"none", fontFamily:DM, fontSize:15, outline:"none" }}/>
        <button onClick={sendChat} disabled={!chatInput.trim()} style={{ width:42, height:42, borderRadius:"50%", background:chatInput.trim()?"#4BC1A0":"rgba(255,255,255,0.08)", border:"none", cursor:chatInput.trim()?"pointer":"default", color:"#fff", fontSize:18, flexShrink:0 }}>↑</button>
      </div>
    </div>
  );

  // Compose view
  if(showCompose) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#021a16", overflow:"hidden" }}>
      <div style={{ padding:"14px 20px 12px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
        <button onClick={()=>setShowCompose(false)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.5)", fontSize:20, cursor:"pointer" }}>←</button>
        <div style={{ fontFamily:DM, fontSize:17, fontWeight:700, color:"#fff" }}>New spark</div>
      </div>
      <div style={{ flex:1, padding:"20px 20px 0", display:"flex", flexDirection:"column", gap:16 }}>
        <div>
          <div style={{ fontFamily:DM, fontSize:13, color:"rgba(255,255,255,0.45)", marginBottom:8 }}>What's on your mind?</div>
          <textarea value={newText} onChange={e=>setNewText(e.target.value)} placeholder="Ask something, share a thought, start a conversation…" style={{ width:"100%", minHeight:120, padding:"14px 16px", borderRadius:16, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.06)", color:"#fff", fontFamily:DM, fontSize:15, outline:"none", resize:"none", boxSizing:"border-box", lineHeight:1.6 }}/>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:6, fontFamily:DM }}>{newText.length}/200</div>
        </div>
        <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:16, padding:"16px", border:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontFamily:DM, fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.6)", marginBottom:12 }}>Share about yourself? (optional)</div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setShareAge(!shareAge)} style={{ flex:1, padding:"10px", borderRadius:12, border:"1.5px solid "+(shareAge?"#4BC1A0":"rgba(255,255,255,0.12)"), background:shareAge?"rgba(75,193,160,0.1)":"none", color:shareAge?"#4BC1A0":"rgba(255,255,255,0.4)", fontFamily:DM, fontSize:13, cursor:"pointer", transition:"all 0.2s" }}>
              {shareAge?"✓ ":""}{userProfile?.dob ? Math.floor((new Date()-new Date(userProfile.dob))/(1000*60*60*24*365.25))+" years old" : "My age"}
            </button>
            <button onClick={()=>setShareGender(!shareGender)} style={{ flex:1, padding:"10px", borderRadius:12, border:"1.5px solid "+(shareGender?"#4BC1A0":"rgba(255,255,255,0.12)"), background:shareGender?"rgba(75,193,160,0.1)":"none", color:shareGender?"#4BC1A0":"rgba(255,255,255,0.4)", fontFamily:DM, fontSize:13, cursor:"pointer", transition:"all 0.2s" }}>
              {shareGender?"✓ ":""}{userProfile?.gender || "My gender"}
            </button>
          </div>
        </div>
        <div style={{ padding:"10px 14px", background:"rgba(75,193,160,0.06)", borderRadius:12, border:"1px solid rgba(75,193,160,0.15)" }}>
          <div style={{ fontFamily:DM, fontSize:12, color:"rgba(255,255,255,0.4)", lineHeight:1.6 }}>🔒 Your spark is anonymous. No one will know it's you. It disappears after 24 hours or when you take it down.</div>
        </div>
      </div>
      <div style={{ padding:"16px 20px 32px", flexShrink:0 }}>
        <button onClick={postStarter} disabled={!newText.trim()||newText.length>200} style={{ width:"100%", padding:"16px", borderRadius:16, border:"none", background:newText.trim()&&newText.length<=200?"#4BC1A0":"rgba(255,255,255,0.1)", color:"#fff", fontFamily:DM, fontSize:16, fontWeight:700, cursor:newText.trim()?"pointer":"default", boxShadow:newText.trim()?"0 6px 24px rgba(75,193,160,0.3)":"none" }}>
          Post spark →
        </button>
      </div>
    </div>
  );

  // Main feed
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:C.bg, overflow:"hidden" }}>
      {reportingPost && <ReportModal onClose={()=>setReportingPost(null)} targetName="Anonymous post" targetId={reportingPost.id} isAnon={true}/>}
      <div style={{ padding:"18px 20px 12px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div>
          <div style={{ fontFamily:DM, fontSize:22, fontWeight:700, color:"#fff" }}>Starters</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2, fontFamily:DM }}>Start an anonymous conversation</div>
        </div>
        {!myStarter ? (
          <button onClick={()=>setShowCompose(true)} style={{ padding:"9px 16px", borderRadius:20, background:"#4BC1A0", border:"none", color:"#fff", fontFamily:DM, fontSize:13, fontWeight:700, cursor:"pointer" }}>
            + New
          </button>
        ) : (
          <button onClick={removeStarter} style={{ padding:"9px 16px", borderRadius:20, background:"rgba(224,82,82,0.15)", border:"1px solid rgba(224,82,82,0.3)", color:"#E05252", fontFamily:DM, fontSize:13, fontWeight:600, cursor:"pointer" }}>
            Take down
          </button>
        )}
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"12px 16px 24px" }}>
        {loading && (
          <div style={{ textAlign:"center", padding:"60px 32px" }}>
            <div style={{ fontFamily:DM, fontSize:14, color:"rgba(255,255,255,0.3)" }}>Loading starters…</div>
          </div>
        )}
        {!loading && starters.map((s,i) => (
          <div key={s.id} style={{ background:s.isOwn?"rgba(75,193,160,0.08)":"rgba(255,255,255,0.05)", borderRadius:18, border:"1.5px solid "+(s.isOwn?"rgba(75,193,160,0.3)":"rgba(255,255,255,0.08)"), padding:"16px", marginBottom:10, cursor:s.isOwn?"default":"pointer", transition:"background 0.2s", position:"relative" }}>
            {!s.isOwn && <button onClick={e=>{e.stopPropagation();setReportingPost(s);}} style={{ position:"absolute", top:12, right:12, background:"none", border:"none", color:"rgba(255,255,255,0.25)", fontSize:16, cursor:"pointer", padding:"4px" }}>⋯</button>}
            <div onClick={()=>!s.isOwn&&openChat(s)}>
            {s.isOwn&&<div style={{ fontSize:10, fontWeight:700, color:"#4BC1A0", fontFamily:DM, letterSpacing:0.5, marginBottom:8, textTransform:"uppercase" }}>Your spark</div>}
            <div style={{ fontFamily:DM, fontSize:15, color:"#fff", lineHeight:1.6, marginBottom:12, paddingRight:s.isOwn?0:24 }}>{s.text}</div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                {(s.age||s.gender)&&(
                  <div style={{ display:"flex", gap:6 }}>
                    {s.age&&<span style={{ fontSize:11, color:"rgba(255,255,255,0.35)", fontFamily:DM, background:"rgba(255,255,255,0.06)", padding:"3px 8px", borderRadius:10 }}>{s.age}</span>}
                    {s.gender&&<span style={{ fontSize:11, color:"rgba(255,255,255,0.35)", fontFamily:DM, background:"rgba(255,255,255,0.06)", padding:"3px 8px", borderRadius:10 }}>{s.gender}</span>}
                  </div>
                )}
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.25)", fontFamily:DM }}>⏱ {timeLabel(s.created_at)}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)", fontFamily:DM }}>💬 {s.replies}</span>
                {!s.isOwn&&<span style={{ fontSize:11, color:"#4BC1A0", fontFamily:DM, fontWeight:600, marginLeft:4 }}>reply →</span>}
              </div>
            </div>
            </div>
          </div>
        ))}
        {!loading && starters.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 32px" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>⚡</div>
            <div style={{ fontFamily:DM, fontSize:18, fontWeight:700, color:"#fff", marginBottom:8 }}>Nothing here yet</div>
            <div style={{ fontFamily:DM, fontSize:14, color:"rgba(255,255,255,0.4)", lineHeight:1.7, marginBottom:24 }}>This is where anonymous conversation starters live. Post something and see who responds.</div>
            <button onClick={()=>setShowCompose(true)} style={{ padding:"12px 24px", borderRadius:16, background:"#4BC1A0", border:"none", color:"#fff", fontFamily:DM, fontSize:14, fontWeight:700, cursor:"pointer" }}>Start a conversation →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Settings Screen ───────────────────────────────────────────────────────────
function SettingsScreen({ onBack, onLogout, onDeleteAccount, userProfile }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReedProfile, setShowReedProfile] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  const Row = ({ icon, label, sublabel, danger, onPress, right }) => (
    <div onClick={onPress} style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 20px", borderBottom:"1px solid "+(C.border), cursor:onPress?"pointer":"default" }}>
      <div style={{ fontSize:20, width:28, textAlign:"center" }}>{icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:DM, fontSize:15, color:danger?"#E05252":C.text, fontWeight:500 }}>{label}</div>
        {sublabel&&<div style={{ fontFamily:DM, fontSize:12, color:C.textDim, marginTop:2 }}>{sublabel}</div>}
      </div>
      {right||( onPress&&!danger&&<div style={{ color:C.textDim, fontSize:16 }}>›</div> )}
    </div>
  );

  // Reed Profile screen
  if(showReedProfile) {
    const p = userProfile || {};
    const dimensions = [
      { label:"Energy", value:p.energy, desc:{ calm:"Calm and considered", balanced:"Balanced", high:"High energy and spontaneous" } },
      { label:"Depth", value:p.depth, desc:{ surface:"Likes to keep things light", medium:"Comfortable going either way", deep:"Goes deep quickly" } },
      { label:"Looking for", value:p.social_goal, desc:{ "activity-partner":"An activity partner", "confidant":"A confidant", "social-circle":"A social circle", "ride-or-die":"A ride-or-die", "open":"Open to anything" } },
      { label:"Life stage", value:p.life_stage, desc:{ "new-to-area":"New to the area", "rebuilding":"Rebuilding social life", "settled":"Settled, wanting more", "transitioning":"Going through a transition", "other":"Other" } },
      { label:"Communication", value:p.comm_style, desc:{ "constant-texter":"Constant texter", "slow-burner":"Slow burner", "banter":"Loves banter", "real-talk":"Prefers real talk", "mixed":"Mixed" } },
      { label:"Humour", value:p.humour, desc:{ dry:"Dry", warm:"Warm", playful:"Playful", dark:"Dark", earnest:"Earnest", mixed:"Mixed" } },
    ];

    return (
      <div style={{ flex:1, display:"flex", flexDirection:"column", background:C.bg, overflow:"hidden" }}>
        <div style={{ padding:"20px 20px 16px", borderBottom:"1px solid "+(C.border), display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <button onClick={()=>setShowReedProfile(false)} style={{ background:"none", border:"none", color:C.text, fontSize:20, cursor:"pointer" }}>←</button>
          <div style={{ fontFamily:DM, fontSize:18, fontWeight:700, color:C.text }}>My Reed profile</div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>

          {/* Legal notice */}
          <div style={{ background:"rgba(75,193,160,0.08)", borderRadius:16, border:"1px solid rgba(75,193,160,0.2)", padding:"16px", marginBottom:20 }}>
            <div style={{ fontFamily:DM, fontSize:13, fontWeight:700, color:C.accent, marginBottom:8 }}>How Reed uses this</div>
            <div style={{ fontFamily:DM, fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.7 }}>
              Reed inferred these characteristics from your conversations. They are used solely to suggest compatible connections within Chins. This information is never shared directly with other users. You can request deletion at any time by contacting support@chins.app.
            </div>
          </div>

          {/* Vibe */}
          {p.vibe&&(
            <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:16, border:"1px solid rgba(255,255,255,0.08)", padding:"16px", marginBottom:12 }}>
              <div style={{ fontFamily:DM, fontSize:11, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Reed's read on you</div>
              <div style={{ fontFamily:DM, fontSize:15, color:C.text, lineHeight:1.6, fontStyle:"italic" }}>"{p.vibe}"</div>
            </div>
          )}

          {/* Six dimensions */}
          <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:16, border:"1px solid rgba(255,255,255,0.08)", overflow:"hidden", marginBottom:12 }}>
            {dimensions.map((d,i)=>(
              <div key={d.label} style={{ padding:"14px 16px", borderBottom:i<dimensions.length-1?"1px solid rgba(255,255,255,0.06)":"none", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontFamily:DM, fontSize:14, color:C.textDim }}>{d.label}</div>
                <div style={{ fontFamily:DM, fontSize:14, color:d.value?C.text:"rgba(255,255,255,0.2)", fontWeight:d.value?600:400 }}>
                  {d.value ? (d.desc[d.value] || d.value) : "Not yet inferred"}
                </div>
              </div>
            ))}
          </div>

          {/* Interests */}
          {p.interests?.length>0&&(
            <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:16, border:"1px solid rgba(255,255,255,0.08)", padding:"16px", marginBottom:12 }}>
              <div style={{ fontFamily:DM, fontSize:11, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:0.5, marginBottom:10 }}>Interests</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {p.interests.map(i=><span key={i} style={{ padding:"5px 12px", borderRadius:20, background:C.accentDim, border:"1px solid "+C.accentGlow, color:C.accent, fontSize:13, fontFamily:DM }}>{i}</span>)}
              </div>
            </div>
          )}

          {/* Request deletion */}
          <button onClick={()=>window.open('mailto:support@chins.app?subject=Delete%20My%20Reed%20Profile&body=Please%20delete%20my%20Reed%20compatibility%20profile.%20My%20account%20email%20is%3A%20','_blank')} style={{ width:"100%", padding:"14px", borderRadius:14, border:"1px solid rgba(224,82,82,0.3)", background:"rgba(224,82,82,0.08)", color:"#E05252", fontFamily:DM, fontSize:14, cursor:"pointer", marginBottom:8 }}>
            Request profile deletion
          </button>
          <div style={{ fontFamily:DM, fontSize:11, color:"rgba(255,255,255,0.25)", textAlign:"center", lineHeight:1.6 }}>
            Requesting deletion will remove your compatibility profile and may affect match suggestions. We will process your request within 30 days.
          </div>
        </div>
      </div>
    );
  }

  // Privacy policy screen
  if(showPrivacyPolicy) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:C.bg, overflow:"hidden" }}>
      <div style={{ padding:"20px 20px 16px", borderBottom:"1px solid "+(C.border), display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
        <button onClick={()=>setShowPrivacyPolicy(false)} style={{ background:"none", border:"none", color:C.text, fontSize:20, cursor:"pointer" }}>←</button>
        <div style={{ fontFamily:DM, fontSize:18, fontWeight:700, color:C.text }}>Privacy policy</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"20px" }}>
        <div style={{ fontFamily:DM, fontSize:11, color:C.textDim, marginBottom:20 }}>Last updated April 06, 2026</div>
        {[
          { heading:"Who we are", body:"This Privacy Notice is for Rowayi Chatora (doing business as Chins). Chins is a social app for adults aged 18 and over, designed to help people build genuine friendships. It is not a dating app.\n\nChins uses an AI companion called Reed, powered by Anthropic's API, to help users discover potential connections. Reed's suggestions are generated entirely by artificial intelligence and do not constitute endorsements, character assessments, background checks or safety guarantees of any kind.\n\nAll decisions to connect, communicate or meet with any other user are made solely and entirely at the user's own risk and discretion. Chins expressly disclaims all liability arising from any interaction between users, whether on or off the platform.\n\nUsers are solely responsible for their own safety at all times." },
          { heading:"What information we collect", body:"We collect: names, phone numbers, email addresses, usernames, passwords, contact preferences, authentication data, user generated content, usage data, user-provided location, and personal information voluntarily disclosed during AI companion conversations.\n\nReed may infer personality traits, preferences and compatibility dimensions from your conversations. These are used solely to suggest compatible connections." },
          { heading:"Sensitive information", body:"We may process sensitive information that users voluntarily share, including information relating to health, sexual orientation, race or ethnic origin, political opinions, and religious beliefs. We only process this where necessary and with your consent." },
          { heading:"How we use your information", body:"We use your information to: create and manage your account, deliver our services, respond to inquiries, send administrative information, enable user communications, generate compatibility profiles, suggest potential connections, protect our services, and comply with legal obligations." },
          { heading:"Who we share your information with", body:"We share data with:\n\n— AI service providers (currently Anthropic PBC)\n— Database and authentication providers (currently Supabase Inc)\n— Hosting providers (currently Vercel Inc)\n— SMS verification providers (currently Twilio Inc)\n— Domain and email providers (currently Names.co.uk)\n— Code repository providers (currently GitHub Inc)\n\nWe do not sell your data. We do not share your data with advertisers." },
          { heading:"International transfers", body:"Our servers are located in the United States, United Kingdom and Ireland. We use Standard Contractual Clauses to protect your data during international transfers." },
          { heading:"How long we keep your information", body:"We keep your information for as long as you have an account with us. When you delete your account, we delete or anonymise your data, except where required by law." },
          { heading:"Security", body:"We implement technical and organisational security measures including encrypted transmission, secure authentication, password hashing, database access controls and API key protection. No system is completely secure." },
          { heading:"Minors", body:"Chins is for adults aged 18 and over. We do not knowingly collect data from minors. Contact support@chins.app if you believe we have collected data from someone under 18." },
          { heading:"Your rights", body:"If you are in the EEA or UK you have the right to access, correct, erase, restrict or port your personal information.\n\nTo exercise your rights: support@chins.app\n\nYou may also complain to the ICO at ico.org.uk." },
          { heading:"Nature of service and limitation of liability", body:"Reed's suggestions are generated entirely by artificial intelligence and do not constitute endorsements, character assessments, background checks or safety guarantees. Chins makes no representation about the identity, character, intentions or trustworthiness of any user. All decisions to connect, communicate or meet with any other user are made solely and entirely at the user's own risk. Chins expressly disclaims all liability arising from any interaction between users, whether on or off the platform." },
          { heading:"Contact", body:"Email: support@chins.app\nPost: Rowayi Chatora, Data Protection Officer, Reading, United Kingdom" },
        ].map((section, i) => (
          <div key={i} style={{ marginBottom:28 }}>
            <div style={{ fontFamily:DM, fontSize:15, fontWeight:700, color:C.text, marginBottom:8 }}>{section.heading}</div>
            <div style={{ fontFamily:DM, fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.8, whiteSpace:"pre-line" }}>{section.body}</div>
          </div>
        ))}
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:20, marginTop:8, fontFamily:DM, fontSize:12, color:"rgba(255,255,255,0.25)", textAlign:"center" }}>
          Questions? Contact support@chins.app
        </div>
      </div>
    </div>
  );

  if (showDeleteConfirm) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:C.bg }}>
      <div style={{ padding:"20px 20px 16px", borderBottom:"1px solid "+(C.border), display:"flex", alignItems:"center", gap:12 }}>
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
        <button onClick={()=>setShowDeleteConfirm(false)} style={{ width:"100%", padding:"16px", borderRadius:16, border:"1px solid "+(C.border), background:"none", color:C.text, fontFamily:DM, fontSize:16, cursor:"pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:C.bg, overflow:"hidden" }}>
      <div style={{ padding:"20px 20px 16px", borderBottom:"1px solid "+(C.border), display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:C.text, fontSize:20, cursor:"pointer" }}>←</button>
        <div style={{ fontFamily:DM, fontSize:18, fontWeight:700, color:C.text }}>Settings</div>
      </div>
      <div style={{ flex:1, overflowY:"auto" }}>
        <div style={{ padding:"20px 20px 6px", fontSize:11, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:1, fontFamily:DM }}>Privacy</div>
        <Row icon="🧠" label="My Reed profile" sublabel="See what Reed has inferred about you" onPress={()=>setShowReedProfile(true)}/>
        <Row icon="📋" label="Download my data" sublabel="Get a copy of everything Chins holds" onPress={()=>{ window.open('mailto:support@chins.app?subject=Data%20Request&body=Hi%2C%20I%20would%20like%20a%20copy%20of%20all%20personal%20data%20Chins%20holds%20about%20me.%20My%20account%20email%20is%3A%20', '_blank'); }}/>

        {/* Support */}
        <div style={{ padding:"20px 20px 6px", fontSize:11, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:1, fontFamily:DM }}>Support</div>
        <Row icon="💬" label="Contact us" sublabel="support@chins.app" onPress={()=>window.open('mailto:support@chins.app','_blank')}/>
        <Row icon="🐛" label="Report a bug" onPress={()=>window.open('mailto:support@chins.app?subject=Bug%20Report','_blank')}/>
        <Row icon="⭐" label="Rate Chins" onPress={()=>{}}/>

        {/* Legal */}
        <div style={{ padding:"20px 20px 6px", fontSize:11, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:1, fontFamily:DM }}>Legal</div>
        <Row icon="🔒" label="Privacy policy" onPress={()=>window.open('https://app.termly.io/policy-viewer/policy.html?policyUUID=fe689e0e-3f09-47ba-b48d-372df55d04a7','_blank')}/>
        <Row icon="📄" label="Terms of service" onPress={()=>window.open('https://app.termly.io/policy-viewer/policy.html?policyUUID=8d3c678c-644d-473e-b115-f80a96727387','_blank')}/>

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
  );
}
function ProfileScreen({ profile, privacyMode, onPrivacyChange, userPhoto, onPhotoUpload, onLogout, onDeleteAccount }) {
  const p = profile || { name:"You", vibe:"Still getting to know you…", interests:[], lookingFor:"", emoji:"🧍" };
  const photoRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);

  if (showSettings) return (
    <SettingsScreen
      onBack={()=>setShowSettings(false)}
      onLogout={onLogout}
      onDeleteAccount={onDeleteAccount}
      userProfile={profile}
    />
  );

  return (
    <div style={{ flex:1,overflowY:"auto",background:C.bg }}>
      <div style={{ padding:"20px 20px 12px",borderBottom:"1px solid "+(C.border), display:"flex", alignItems:"center", justifyContent:"space-between" }}>
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

        {/* Privacy toggle */}
        <div style={{ marginBottom:24,padding:"16px",background:C.surface,borderRadius:18,border:"1px solid "+(C.border) }}>
          <div style={{ fontFamily:DM,fontSize:13,fontWeight:700,color:C.text,marginBottom:12 }}>Privacy mode</div>
          <div style={{ display:"flex",gap:8 }}>
            {["private","discoverable"].map(mode=>(
              <button key={mode} onClick={()=>onPrivacyChange(mode)} style={{ flex:1,padding:"10px",borderRadius:12,border:"1.5px solid "+(privacyMode===mode?C.accent:C.border),background:privacyMode===mode?C.accentDim:"none",color:privacyMode===mode?C.accent:C.textDim,fontFamily:DM,fontSize:13,fontWeight:privacyMode===mode?700:400,cursor:"pointer",transition:"all 0.2s" }}>
                {mode==="private"?"🔒 Private":"🌍 Discoverable"}
              </button>
            ))}
          </div>
          <div style={{ fontSize:12,color:C.textDim,marginTop:10,fontFamily:DM,lineHeight:1.6 }}>
            {privacyMode==="private"?"You're invisible. Reed suggests connections on your behalf.":"Your alias and interests are visible. Reed still suggests connections."}
          </div>
        </div>

        {p.interests?.length>0&&(
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:10,fontFamily:DM }}>Interests</div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
              {p.interests.map(i=><span key={i} style={{ padding:"6px 14px",borderRadius:20,background:C.accentDim,border:"1px solid "+(C.accentGlow),color:C.accent,fontSize:13,fontFamily:DM }}>{i}</span>)}
            </div>
          </div>
        )}

        {/* Your area */}
        <div style={{ marginBottom:20,padding:"16px",background:C.surface,borderRadius:18,border:"1px solid "+(C.border) }}>
          <div style={{ fontFamily:DM,fontSize:13,fontWeight:700,color:C.text,marginBottom:4 }}>Your area</div>
          <div style={{ fontSize:12,color:C.textDim,fontFamily:DM,marginBottom:10,lineHeight:1.5 }}>
            {p.city ? `Reed thinks you're in ${p.area||p.city}.` : "Reed hasn't picked up your area yet — you can set it here."}
          </div>
          <input
            defaultValue={p.area||p.city||""}
            placeholder="e.g. South London, Manchester..."
            onBlur={e=>{
              const val = e.target.value.trim();
              if(val && window._authToken && window._userId) {
                sb.upsertProfile(window._authToken, window._userId, { area: val, city: val });
              }
            }}
            style={{ width:"100%",padding:"10px 14px",borderRadius:12,border:"1px solid "+(C.border),background:"rgba(255,255,255,0.05)",color:C.text,fontFamily:DM,fontSize:14,outline:"none",boxSizing:"border-box" }}
          />
          <div style={{ fontSize:11,color:"rgba(255,255,255,0.2)",marginTop:8,fontFamily:DM }}>Used only to suggest nearby connections. Never shared with other users directly.</div>
        </div>

        <div style={{ padding:"14px 16px",background:C.accentDim,borderRadius:16,border:"1px solid "+(C.accentGlow) }}>
          <div style={{ display:"flex",gap:10,alignItems:"flex-start" }}>
            <img src={REED_IMG} style={{ width:24, height:24, borderRadius:"50%", objectFit:"cover", objectPosition:"center top", flexShrink:0, display:"block" }} alt="Reed"/>
            <div style={{ fontSize:13,color:C.accent,lineHeight:1.6,fontStyle:"italic",fontFamily:DM }}>
              "The more I know you, the better your matches get. Keep talking to me."
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Global Styles ─────────────────────────────────────────────────────────────
const globalStyles = `  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');\n  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --sat: env(safe-area-inset-top, 0px); --sab: env(safe-area-inset-bottom, 0px); }\n  body { background: #021a16; }\n  @keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }\n  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }\n  @keyframes tilefloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-7px)} }\n  @keyframes reedBob { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-5px)} }\n  @keyframes reedBounce { 0%{transform:translateY(0px)} 100%{transform:translateY(-10px)} }\n  @keyframes reedRun { 0%{transform:rotate(-8deg) translateY(0)} 100%{transform:rotate(8deg) translateY(-4px)} }\n  @keyframes bubbleIn { from{opacity:0;transform:translateX(-50%) scale(0.85)} to{opacity:1;transform:translateX(-50%) scale(1)} }\n  @keyframes targetPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }\n  @keyframes float3 { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-8px)} }\n  @keyframes float4 { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-12px)} }\n  @keyframes float5 { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-6px)} }\n  @keyframes drift0 { 0%{transform:translate(-50%,-50%) translate(0,0)} 25%{transform:translate(-50%,-50%) translate(18px,-22px)} 50%{transform:translate(-50%,-50%) translate(-10px,-38px)} 75%{transform:translate(-50%,-50%) translate(-28px,-14px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }\n  @keyframes drift1 { 0%{transform:translate(-50%,-50%) translate(0,0)} 30%{transform:translate(-50%,-50%) translate(-22px,16px)} 60%{transform:translate(-50%,-50%) translate(14px,30px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }\n  @keyframes drift2 { 0%{transform:translate(-50%,-50%) translate(0,0)} 20%{transform:translate(-50%,-50%) translate(28px,12px)} 55%{transform:translate(-50%,-50%) translate(8px,-24px)} 80%{transform:translate(-50%,-50%) translate(-18px,-8px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }\n  @keyframes drift3 { 0%{transform:translate(-50%,-50%) translate(0,0)} 35%{transform:translate(-50%,-50%) translate(20px,-18px)} 70%{transform:translate(-50%,-50%) translate(-12px,-30px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }\n  @keyframes drift4 { 0%{transform:translate(-50%,-50%) translate(0,0)} 25%{transform:translate(-50%,-50%) translate(-24px,-20px)} 50%{transform:translate(-50%,-50%) translate(-36px,10px)} 75%{transform:translate(-50%,-50%) translate(-16px,26px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }\n  @keyframes drift5 { 0%{transform:translate(-50%,-50%) translate(0,0)} 40%{transform:translate(-50%,-50%) translate(22px,20px)} 70%{transform:translate(-50%,-50%) translate(10px,-16px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }\n  @keyframes drift6 { 0%{transform:translate(-50%,-50%) translate(0,0)} 30%{transform:translate(-50%,-50%) translate(-18px,24px)} 65%{transform:translate(-50%,-50%) translate(16px,32px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }\n  @keyframes drift7 { 0%{transform:translate(-50%,-50%) translate(0,0)} 20%{transform:translate(-50%,-50%) translate(26px,-14px)} 50%{transform:translate(-50%,-50%) translate(38px,8px)} 80%{transform:translate(-50%,-50%) translate(12px,22px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }\n  @keyframes drift8 { 0%{transform:translate(-50%,-50%) translate(0,0)} 45%{transform:translate(-50%,-50%) translate(-20px,-28px)} 75%{transform:translate(-50%,-50%) translate(10px,-18px)} 100%{transform:translate(-50%,-50%) translate(0,0)} }\n  ::-webkit-scrollbar { display: none; }\n  input, textarea, button { font-family: 'DM Sans', sans-serif; }`;



























// ── Tab Icons ─────────────────────────────────────────────────────────────────
function TabIcon({ id, active }) {
  const c = active ? "#fff" : "rgba(255,255,255,0.35)";
  const sw = 1.5;
  const sc = { stroke:c, strokeWidth:sw, strokeLinecap:"round", strokeLinejoin:"round", fill:"none" };
  switch(id) {
    case "connect": return (
      <svg width="20" height="20" viewBox="0 0 24 22" fill="none">
        <ellipse cx="9" cy="7.5" rx="3.2" ry="3.2" stroke={c} strokeWidth={sw} fill="none" opacity={active?1:0.8}/>
        <path d="M3 20 C3 15.5 5.8 13 9 13 C10.1 13 11.1 13.3 12 13.9" stroke={c} strokeWidth={sw} strokeLinecap="round" fill="none" opacity={active?1:0.8}/>
        <ellipse cx="15.5" cy="7" rx="3.4" ry="3.4" stroke={c} strokeWidth={sw} fill="none"/>
        <path d="M9 21 C9 16.2 12 13.5 15.5 13.5 C19 13.5 22 16.2 22 21" {...sc} strokeWidth="1.8"/>
      </svg>
    );
    case "chats": return (
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
        <path d="M3 3.5 H19 A1.5 1.5 0 0 1 20.5 5 V13 A1.5 1.5 0 0 1 19 14.5 H10 L5.5 19 V14.5 H3 A1.5 1.5 0 0 1 1.5 13 V5 A1.5 1.5 0 0 1 3 3.5 Z" {...sc}/>
        <line x1="6" y1="8.5" x2="16" y2="8.5" {...sc}/>
        <line x1="6" y1="11.5" x2="12" y2="11.5" {...sc}/>
      </svg>
    );
    case "plans": return (
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="5" width="18" height="15" rx="3" stroke={c} strokeWidth={sw} fill="none"/>
        <path d="M2 9 H20" stroke={c} strokeWidth={sw}/>
        <line x1="7.5" y1="2" x2="7.5" y2="6.5" stroke={c} strokeWidth={sw} strokeLinecap="round"/>
        <line x1="14.5" y1="2" x2="14.5" y2="6.5" stroke={c} strokeWidth={sw} strokeLinecap="round"/>
        <circle cx="7" cy="13" r="1.2" fill={c}/>
        <circle cx="11" cy="13" r="1.2" fill={c}/>
        <circle cx="15" cy="13" r="1.2" fill={c}/>
        <circle cx="7" cy="17" r="1.2" fill={c} opacity="0.5"/>
        <circle cx="11" cy="17" r="1.2" fill={active?"#4BC1A0":c} opacity={active?1:0.5}/>
      </svg>
    );
    case "mingle": return (
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
        <path d="M2 5 C2 5 8 5 11 11 C14 17 20 17 20 17" stroke={c} strokeWidth={sw} strokeLinecap="round" fill="none"/>
        <path d="M17 14.5 L20.5 17 L17.5 19.5" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M2 17 C2 17 8 17 11 11 C14 5 20 5 20 5" stroke={c} strokeWidth={sw} strokeLinecap="round" fill="none"/>
        <path d="M17 2.5 L20.5 5 L17.5 7.5" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    );
    case "candid": return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 9 L3 15 L7 15 L15 20 L15 4 L7 9 L3 9Z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M19 8 C20.5 9.5 20.5 14.5 19 16" stroke={c} strokeWidth={sw} strokeLinecap="round" fill="none"/>
        <line x1="3" y1="15" x2="5" y2="21" stroke={c} strokeWidth={sw} strokeLinecap="round"/>
      </svg>
    );
    case "profile": return (
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="7.5" r="3.5" {...sc}/>
        <path d="M3.5 20 C3.5 15.5 6.8 12.5 11 12.5 C15.2 12.5 18.5 15.5 18.5 20" {...sc}/>
      </svg>
    );
    default: return null;
  }
}

// ── Profile Review Screen ────────────────────────────────────────────────────
function ProfileReviewScreen({ profile, chipAnimal, onConfirm, onAdjust }) {
  const traits = [
    { label:"Energy", value: profile.energy },
    { label:"Communication", value: profile.commStyle?.replace(/-/g," ") },
    { label:"Looking for", value: profile.socialGoal?.replace(/-/g," ") },
    { label:"Humour", value: profile.humour },
  ].filter(t=>t.value);

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#021a16", position:"relative", overflow:"hidden" }}>
      <BlobBackground overlayStrength="0.88"/>
      <div style={{ flex:1, overflowY:"auto", padding:"52px 24px 16px", position:"relative" }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
          <img src={REED_IMG} style={{ width:80, height:80, objectFit:"contain" }} alt="Reed"/>
        </div>
        <div style={{ fontFamily:DM, fontSize:13, color:C.accent, fontWeight:600, textAlign:"center", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Your profile</div>
        <div style={{ fontFamily:DM, fontSize:26, fontWeight:700, color:"#fff", textAlign:"center", letterSpacing:-0.5, marginBottom:6 }}>
          {profile.alias || profile.name}
          {chipAnimal && <span style={{ marginLeft:8 }}>{chipAnimal.emoji}</span>}
        </div>
        <div style={{ fontFamily:DM, fontSize:15, color:"rgba(255,255,255,0.6)", textAlign:"center", lineHeight:1.65, marginBottom:28, padding:"0 8px" }}>
          {profile.vibe}
        </div>

        {profile.interests?.length > 0 && (
          <div style={{ marginBottom:24 }}>
            <div style={{ fontFamily:DM, fontSize:12, color:"rgba(255,255,255,0.35)", fontWeight:600, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Interests</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {profile.interests.slice(0,8).map((t,i)=>(
                <div key={i} style={{ padding:"7px 14px", borderRadius:20, background:"rgba(75,193,160,0.12)", border:"1px solid rgba(75,193,160,0.25)", fontFamily:DM, fontSize:13, color:C.accent }}>{t}</div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom:28 }}>
          <div style={{ fontFamily:DM, fontSize:12, color:"rgba(255,255,255,0.35)", fontWeight:600, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>How Reed sees you</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {traits.map((t,i)=>(
              <div key={i} style={{ padding:"7px 14px", borderRadius:20, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", fontFamily:DM, fontSize:13, color:"rgba(255,255,255,0.7)" }}>
                <span style={{ color:"rgba(255,255,255,0.4)", marginRight:4 }}>{t.label}:</span>{t.value}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding:"14px 16px", background:"rgba(75,193,160,0.08)", borderRadius:16, border:"1px solid rgba(75,193,160,0.2)", marginBottom:8 }}>
          <div style={{ fontFamily:DM, fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>
            This profile helps me find people who'll genuinely click with you. You can update it any time from Settings.
          </div>
        </div>
      </div>

      <div style={{ padding:"16px 24px 44px", flexShrink:0, position:"relative", display:"flex", flexDirection:"column", gap:10 }}>
        <button onClick={onConfirm} style={{ width:"100%", padding:"17px", borderRadius:16, border:"none", background:C.accent, color:"#fff", fontFamily:DM, fontSize:16, fontWeight:700, cursor:"pointer", boxShadow:"0 6px 24px rgba(75,193,160,0.3)" }}>
          This is me — let's go →
        </button>
        <button onClick={onAdjust} style={{ width:"100%", padding:"14px", borderRadius:16, border:"1px solid rgba(255,255,255,0.12)", background:"none", color:"rgba(255,255,255,0.5)", fontFamily:DM, fontSize:15, fontWeight:500, cursor:"pointer" }}>
          Not quite — let me adjust
        </button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function ChinsApp() {
  // Screen flow: splash → signup → privacy → safety → meet-reed → main
  const [screen, setScreen] = useState("splash");
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [tab, setTab] = useState("connect");
  const [profile, setProfile] = useState(null);
  const [privacyMode, setPrivacyMode] = useState("discoverable");
  const [msgs, setMsgs] = useState([]);
  const [hist, setHist] = useState([]);
  const [started, setStarted] = useState(false);
  const [kicked, setKicked] = useState(false);
  const [returningKicked, setReturningKicked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [profileInsertIdx, setProfileInsertIdx] = useState(null);
  const [chipAnimal, setChipAnimal] = useState(null);
  const [showAnimalToast, setShowAnimalToast] = useState(false);
  const [connectionCount, setConnectionCount] = useState(0);
  const [userPhoto, setUserPhoto] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [userId, setUserId] = useState(null);
  useEffect(()=>{ window._authToken = authToken; window._userId = userId; },[authToken, userId]);
  const [showProfile, setShowProfile] = useState(false);
  const photoRef = useRef(null);

  const resetAuth = () => { if(userId){ try{ localStorage.removeItem('chins_reed_' + userId); }catch{} } setAuthToken(null); setUserId(null); setScreen("splash"); setProfile(null); setMsgs([]); setHist([]); setStarted(false); setKicked(false); setReturningKicked(false); setTab("connect"); };

  // Detect email confirmation redirect from Supabase
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(hash.replace('#', ''));

    const tokenHash = params.get('token_hash');
    const type = params.get('type') || hashParams.get('type');
    const accessToken = hashParams.get('access_token') || params.get('access_token');

    if (tokenHash && type) {
      // New Supabase PKCE flow — exchange token_hash for session
      fetch(SUPABASE_URL + '/auth/v1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({ token_hash: tokenHash, type })
      }).then(r => r.json()).then(data => {
        if (data?.access_token) {
          setAuthToken(data.access_token);
          fetch(SUPABASE_URL + '/auth/v1/user', {
            headers: { 'Authorization': 'Bearer ' + data.access_token, 'apikey': SUPABASE_ANON_KEY }
          }).then(r => r.json()).then(user => {
            if (user?.id) setUserId(user.id);
          }).catch(() => {});
        }
        setEmailConfirmed(true);
        window.history.replaceState({}, document.title, '/');
      }).catch(() => {
        setEmailConfirmed(true);
        window.history.replaceState({}, document.title, '/');
      });
    } else if (accessToken || type === 'signup') {
      // Legacy implicit flow
      if (accessToken) {
        fetch(SUPABASE_URL + '/auth/v1/user', {
          headers: { 'Authorization': 'Bearer ' + accessToken, 'apikey': SUPABASE_ANON_KEY }
        }).then(r => r.json()).then(user => {
          if (user?.id) { setAuthToken(accessToken); setUserId(user.id); }
        }).catch(() => {});
      }
      setEmailConfirmed(true);
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  useEffect(()=>{ if(started&&!kicked){setKicked(true);kickoff();} },[started]);
  // Persist Reed conversation to localStorage on every update
  useEffect(() => {
    if(userId && msgs.length > 0) {
      try { localStorage.setItem('chins_reed_' + userId, JSON.stringify({ msgs, hist })); } catch {}
    }
  }, [msgs, userId]);

  // Load saved chat when userId is set (after login)
  useEffect(() => {
    if(!userId) return;
    const saved = localStorage.getItem('chins_reed_' + userId);
    if(saved) {
      try {
        const { msgs: m, hist: h } = JSON.parse(saved);
        if(m && m.length > 0) { setMsgs(m); setHist(h || []); }
      } catch {}
    }
  }, [userId]);
  // Returning user: welcome back kickoff when profile exists but no chat loaded
  useEffect(() => {
    if(profile && userId && !started && !returningKicked && !kicked) {
      let hasSaved = false;
      try { const sv = localStorage.getItem('chins_reed_' + userId); if(sv){ const sp=JSON.parse(sv); hasSaved = (sp.msgs && sp.msgs.length > 0); } } catch {}
      if(!hasSaved && msgs.length === 0) { setReturningKicked(true); kickoffReturning(); }
    }
  }, [profile, userId]);


  const callReed = async (messages) => {
    const r = await fetch(API, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        model:"claude-haiku-4-5-20251001",
        max_tokens:800,
        system:REED_PROMPT,
        messages,
        tools:[{ type:"web_search_20250305", name:"web_search" }]
      }),
    });
    const d = await r.json();
    if(d.error) throw new Error(d.error.message);
    // Extract text from response — may contain tool use blocks
    const textBlock = d.content?.find(b=>b.type==="text");
    return textBlock?.text || "";
  };

  const kickoff = async () => {
    setLoading(true);
    try {
      const text = await callReed([{role:"user",content:"start"}]);
      setHist([{role:"user",content:"start"},{role:"assistant",content:text}]);
      setMsgs([{role:"reed",text}]);
    } catch {
      const fb = "hey — I'm Reed. before we get into anything, quick question: if you had a completely free Saturday with no obligations, what would actually happen?";
      setMsgs([{role:"reed",text:fb}]);
      setHist([{role:"user",content:"start"},{role:"assistant",content:fb}]);
    }
    setLoading(false);
  };


  const kickoffReturning = async () => {
    setLoading(true);
    const alias = profile?.alias || profile?.display_name || "friend";
    const profileSummary = JSON.stringify({ alias, vibe: profile?.vibe, interests: profile?.interests?.slice(0,4), energy: profile?.energy });
    const returningPrompt = "[RETURNING USER] " + alias + " is back. Their profile: " + profileSummary + ". Greet them warmly as a friend you already know — 1-2 sentences max. Ask how things have been.";
    try {
      const text = await callReed([{role:"user", content: returningPrompt}]);
      const clean = text.replace(/<profile>[\s\S]*?<\/profile>/g,"").replace(/<navigate>[\s\S]*?<\/navigate>/g,"").replace(/<location>[\s\S]*?<\/location>/g,"").trim();
      setHist([{role:"user",content:returningPrompt},{role:"assistant",content:clean}]);
      setMsgs([{role:"reed",text:clean}]);
    } catch {
      const fallback = "hey " + alias + "! good to see you again — how've things been?";
      setMsgs([{role:"reed",text:fallback}]);
      setHist([{role:"user",content:"[RETURNING USER]"},{role:"assistant",content:fallback}]);
    }
    setLoading(false);
  };

  const processReply = (raw, histBase) => {
    const clean = raw.replace(/<profile>[\s\S]*?<\/profile>/g,"").replace(/<animal>[\s\S]*?<\/animal>/g,"").replace(/<navigate>[\s\S]*?<\/navigate>/g,"").replace(/<location>[\s\S]*?<\/location>/g,"").trim();
    setHist([...histBase,{role:"assistant",content:clean}]);
    const pm = raw.match(/<profile>([\s\S]*?)<\/profile>/);
    if(pm&&!profile){
      try{
        const parsed = JSON.parse(pm[1]);
        setProfile(parsed);
        setProfileInsertIdx(msgs.length+1);
        // Save profile to Supabase
        if(authToken && userId) {
          sb.upsertProfile(authToken, userId, {
            first_name: parsed.name?.split(" ")[0] || "",
            display_name: parsed.alias || parsed.name || "",
            vibe: parsed.vibe || "",
            looking_for: parsed.lookingFor || "",
            interests: parsed.interests || [],
            comm_style: parsed.commStyle || "",
            energy: parsed.energy || "",
            depth: parsed.depth || "",
            social_goal: parsed.socialGoal || "",
            life_stage: parsed.lifeStage || "",
            humour: parsed.humour || "",
            privacy_mode: parsed.privacyMode || "discoverable",
            reed_complete: true,
          });
        }
        const signoff = "I think I've got a good sense of you now. Before I take you in, I've put together a quick profile — have a look and let me know if it feels right.";
        setTimeout(()=>{ setMsgs(prev=>[...prev,{role:"reed",text:signoff}]); }, 600);
        // Save completion flag to localStorage as fallback
        if(userId) { try { localStorage.setItem('chins_complete_' + userId, '1'); } catch {} }
        setTimeout(()=>{ setScreen("profile-review"); }, 1800);
      }catch{}
    }
    const lm = raw.match(/<location>([\s\S]*?)<\/location>/);
    if(lm) {
      try {
        const loc = JSON.parse(lm[1]);
        if(authToken && userId && loc.city) {
          sb.upsertProfile(authToken, userId, {
            city: loc.city || "",
            area: loc.area || loc.city || "",
          });
        }
      } catch {}
    }
    const am = raw.match(/<animal>([\s\S]*?)<\/animal>/);
    if(am&&!chipAnimal){
      try{
        const a=JSON.parse(am[1]);
        setChipAnimal(a);
        setShowAnimalToast(true);
        setTimeout(()=>setShowAnimalToast(false),8000);
        if(authToken && userId) sb.upsertProfile(authToken, userId, { chip_animal: a });
      }catch{}
    }
    // Handle navigate tag
    const navM = raw.match(/<navigate>([\s\S]*?)<\/navigate>/); if(navM){ const dest=navM[1].trim(); if(dest==="main"){ if(userId){try{localStorage.setItem('chins_complete_'+userId,'1');}catch{}} if(authToken&&userId) sb.upsertProfile(authToken,userId,{reed_complete:true}); setTimeout(()=>{ setScreen("main"); setTab("connect"); },800); } }
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
    catch(e){ setMsgs(prev=>[...prev,{role:"reed",text:"⚠️ "+(e.message)}]); }
    setLoading(false);
  };

  const tabs = [
    { id:"connect", label:"Connect", color:"#4BC1A0" },
    { id:"chats",   label:"Chats",   color:"#66BB6A" },
    { id:"plans",   label:"Plans",   color:"#C9D1A5" },
    { id:"mingle",  label:"Mingle",  color:"#E1814C" },
    { id:"candid",  label:"Starters", color:"#4BC1A0" },
    { id:"reed",    label:"Reed",    color:"#4BC1A0" },
  ];

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ position:"fixed", inset:0, display:"flex", justifyContent:"center", alignItems:"center", background:"#021a16", fontFamily:DM, overflow:"hidden" }}>
        <div style={{ width:"100%", maxWidth:480, height:"100%", background:C.bg, borderRadius:0, overflow:"hidden", position:"relative", display:"flex", flexDirection:"column" }}>

          {/* Email confirmation landing page */}
          {emailConfirmed&&(
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 32px", textAlign:"center", background:"#021a16", position:"relative" }}>
              <BlobBackground/>
              <div style={{ position:"relative", zIndex:1 }}>
                <img src={REED_IMG} style={{ width:130, height:130, objectFit:"contain", marginBottom:24, filter:"drop-shadow(0 4px 20px rgba(75,193,160,0.3))" }} alt="Reed"/>
                <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
                <div style={{ fontFamily:DM, fontSize:24, fontWeight:700, color:"#fff", marginBottom:12 }}>You're verified!</div>
                <div style={{ fontFamily:DM, fontSize:15, color:"rgba(255,255,255,0.55)", lineHeight:1.7, marginBottom:36 }}>
                  Your email has been confirmed. Reed is waiting for you.
                </div>
                <button onClick={async ()=>{
                  setEmailConfirmed(false);
                  // If we already have a token from the verification exchange, go straight in
                  if (authToken && userId) {
                    try {
                      const r = await fetch(SUPABASE_URL+'/rest/v1/profiles?user_id=eq.'+userId+'&select=*', {
                        headers:{ 'Authorization':'Bearer '+authToken, 'apikey':SUPABASE_ANON_KEY }
                      });
                      const rows = await r.json();
                      const prof = rows?.[0];
                      if (prof?.reed_complete) {
                        setProfile(prof);
                        setPrivacyMode(prof.privacy_mode||"discoverable");
                        setScreen("main"); setTab("connect");
                      } else {
                        setScreen("privacy");
                      }
                    } catch {
                      setScreen("privacy");
                    }
                  } else {
                    // Fallback to login screen if token exchange failed
                    setScreen("login");
                  }
                }} style={{ width:"100%", padding:"17px", borderRadius:16, border:"none", background:"#4BC1A0", color:"#fff", fontFamily:DM, fontSize:16, fontWeight:700, cursor:"pointer", boxShadow:"0 6px 24px rgba(75,193,160,0.35)" }}>
                  Meet Reed →
                </button>
              </div>
            </div>
          )}

          {!emailConfirmed&&(
            <>
              {screen==="splash"&&<SplashScreen onSignup={()=>setScreen("signup")} onLogin={()=>setScreen("login")}/>}
          {screen==="login"&&<LoginScreen onComplete={(data)=>{
            setAuthToken(data.token);
            setUserId(data.user.id);
            // Check localStorage for onboarding completion as fallback
            const lsComplete = localStorage.getItem("chins_complete_" + data.user.id) === "1";
            if(data.profile?.reed_complete || lsComplete) {
              if(data.profile) {
                setProfile(data.profile);
                setPrivacyMode(data.profile.privacy_mode||"discoverable");
                setChipAnimal(data.profile.chip_animal||null);
              }
              setScreen("main");
              setTab("connect");
            } else if(data.profile) {
              setProfile(data.profile);
              setPrivacyMode(data.profile.privacy_mode||"discoverable");
              setStarted(true);
              setScreen("onboarding");
            } else {
              setScreen("privacy");
            }
          }} onBack={()=>setScreen("splash")}/>}
          {screen==="signup"&&<SignupScreen onComplete={(form)=>setScreen("privacy")} onBack={()=>setScreen("splash")}/>}
          {screen==="privacy"&&<PrivacyScreen onAccept={()=>setScreen("safety")}/>}
          {screen==="safety"&&<SafetyScreen onContinue={()=>setScreen("meet-reed")}/>}
          {screen==="meet-reed"&&<MeetReedScreen onComplete={(mode)=>{ setPrivacyMode(mode); setScreen("onboarding"); setStarted(true); }}/>}

          {screen==="onboarding"&&(
            <ReedChat
              msgs={msgs} loading={loading} input={input} setInput={setInput}
              send={send} profile={profile} progress={Math.min(profile?100:95,msgs.filter(m=>m.role==="user").length*12)}
              chipAnimal={chipAnimal} showAnimalToast={showAnimalToast} setShowAnimalToast={setShowAnimalToast}
              profileInsertIdx={profileInsertIdx} privacyMode={privacyMode}
              onSkip={()=>{ if(userId){try{localStorage.setItem('chins_complete_'+userId,'1');}catch{}} if(authToken&&userId) sb.upsertProfile(authToken,userId,{reed_complete:true}); setScreen("main"); setTab("connect"); }}
            />
          )}

          {screen==="profile-review"&&profile&&(
            <ProfileReviewScreen
              profile={profile}
              chipAnimal={chipAnimal}
              onConfirm={()=>{ setScreen("main"); setTab("connect"); }}
              onAdjust={()=>{ setScreen("onboarding"); }}
            />
          )}

          {screen==="main"&&(
            <>
              <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" }}>
                {tab==="connect"&&<ConnectScreen userProfile={profile} connectionCount={connectionCount} onConnect={p=>setConnectionCount(c=>c+1)} privacyMode={privacyMode} onGoToReed={()=>setTab("reed")} chipAnimal={chipAnimal}/>}
                {tab==="chats"&&<ChatsScreen chipAnimal={chipAnimal}/>}
                {tab==="plans"&&<PlansScreen userProfile={profile} chipAnimal={chipAnimal}/>}
                {tab==="mingle"&&<MingleScreen userProfile={profile} chipAnimal={chipAnimal}/>}
                {tab==="candid"&&<SparkScreen userProfile={profile} authToken={authToken}/>}
                {tab==="reed"&&(
                  <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" }}>
                    <ReedChat
                      msgs={msgs} loading={loading} input={input} setInput={setInput}
                      send={send} profile={profile} progress={100}
                      chipAnimal={chipAnimal} showAnimalToast={showAnimalToast} setShowAnimalToast={setShowAnimalToast}
                      profileInsertIdx={profileInsertIdx} privacyMode={privacyMode}
                      onProfile={()=>setShowProfile(true)}
                    />
                    {showProfile&&(
                      <div style={{ position:"absolute", inset:0, zIndex:50, display:"flex", flexDirection:"column" }}>
                        <div style={{ padding:"14px 20px 12px", background:"#021a16", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", gap:12 }}>
                          <button onClick={()=>setShowProfile(false)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.5)", fontSize:20, cursor:"pointer" }}>←</button>
                          <div style={{ fontFamily:DM, fontSize:17, fontWeight:700, color:"#fff" }}>Your profile</div>
                        </div>
                        <div style={{ flex:1, overflow:"hidden" }}>
                          <input ref={photoRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ const f=e.target.files[0]; if(f)setUserPhoto(URL.createObjectURL(f)); e.target.value=""; }}/>
                          <ProfileScreen
                            profile={profile}
                            privacyMode={privacyMode}
                            onPrivacyChange={setPrivacyMode}
                            userPhoto={userPhoto}
                            onPhotoUpload={setUserPhoto}
                            onLogout={async()=>{ if(authToken) await sb.signOut(authToken); resetAuth(); }}
                            onDeleteAccount={async()=>{
                              try {
                                await fetch('/api/delete-account', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ userId, token: authToken })
                                });
                              } catch(e) {}
                              resetAuth();
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div style={{ padding:"8px 12px 12px", background:"transparent", flexShrink:0 }}>
                <div style={{ display:"flex", background:"#000", borderRadius:24, padding:"4px", border:"1px solid rgba(255,255,255,0.08)" }}>
                  {tabs.map(t=>(
                    <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"8px 4px 6px", background:tab===t.id?"rgba(75,193,160,0.12)":"none", border:"none", cursor:"pointer", gap:3, borderRadius:20, transition:"background 0.2s" }}>
                      {t.id==="reed"
                        ? <img src={REED_IMG} style={{ width:24, height:24, borderRadius:"50%", objectFit:"cover", objectPosition:"center top", display:"block", filter:tab===t.id?"none":"grayscale(0.5) opacity(0.5)" }} alt="Reed"/>
                        : <TabIcon id={t.id} active={tab===t.id}/>
                      }
                      <span style={{ fontSize:8, color:tab===t.id?"#4BC1A0":"rgba(255,255,255,0.4)", fontWeight:tab===t.id?700:400, textTransform:"uppercase", letterSpacing:0.5, fontFamily:DM }}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

