export const EVENTS = [
  { id:1, title:"Parkrun — Victoria Park",      emoji:"🏅", time:"this-weekend", date:"Saturday",  clock:"8:00am", location:"Victoria Park, E9",    tags:["Running","Free"],   going:false, who:[{ personId:7, name:"Dog Dad",  initials:"A", gradient:"linear-gradient(160deg,#11998E,#38EF7D)" }], reedNote:"Dog Dad is doing this one — you've been meaning to try parkrun." },
  { id:2, title:"Board Game Night",             emoji:"🎲", time:"this-weekend", date:"Friday",    clock:"7:00pm", location:"Draughts, Hackney",    tags:["Social","Games"],   going:false, who:[{ personId:4, name:"Board Game Nerd", initials:"M", gradient:"linear-gradient(160deg,#34D399,#059669)" }], reedNote:"Board Game Nerd runs this. He'd love more people." },
  { id:3, title:"Queer Hikers — Epping Forest", emoji:"🏳️‍🌈", time:"this-weekend", date:"Sunday",   clock:"9:00am", location:"Epping Forest, Essex", tags:["Hiking","LGBTQ+"],  going:false, who:[{ personId:9, name:"Queer Hiker", initials:"J", gradient:"linear-gradient(160deg,#F472B6,#8B5CF6)" }] },
  { id:4, title:"Sunday Run Club",              emoji:"🏃", time:"this-weekend", date:"Sunday",   clock:"9:00am", location:"Regent's Canal, N1",   tags:["Running","Social"], going:false, who:[] },
  { id:5, title:"Bouldering Intro",             emoji:"🧗", time:"this-week",    date:"Wednesday",clock:"6:30pm", location:"The Castle, N4",        tags:["Climbing","Beginner"],going:false, who:[{ personId:12, name:"The Climber", initials:"T", gradient:"linear-gradient(160deg,#F97316,#EF4444)" }] },
];

export const EVENT_CATEGORIES = [
  { id:"all", label:"All", emoji:"✨" },
  { id:"this-week", label:"This week", emoji:"📅" },
  { id:"this-weekend", label:"Weekend", emoji:"🎉" },
];

export const MOCK_CHATS = [
  { id:1, personId:1, name:"Maya", alias:"The Photographer", gradient:"linear-gradient(160deg,#FF6B6B,#FF8E53)", initials:"M", time:"2m", unread:2, messages:[{sender:"them",text:"hey! reed said you also do the canal route?"},{sender:"me",text:"yeah every Sunday, usually around 9"},{sender:"them",text:"I've been looking for someone to run with"},{sender:"them",text:"Sunday 9am?"}] },
  { id:2, personId:9, name:"Jamie", alias:"Queer Hiker", gradient:"linear-gradient(160deg,#F472B6,#8B5CF6)", initials:"J", time:"1h", unread:0, messages:[{sender:"reed-nudge",text:"hey — Queer Hiker organises a hiking group and you mentioned wanting to get into hiking"},{sender:"them",text:"hey! reed dragged me here 😊"},{sender:"me",text:"trying to be! just started trail running too"},{sender:"them",text:"you should come to Epping Forest Sunday"}] },
  { id:3, personId:4, name:"Marcus", alias:"Board Game Nerd", gradient:"linear-gradient(160deg,#34D399,#059669)", initials:"M", time:"3h", unread:1, messages:[{sender:"them",text:"reed said you might be into board games?"},{sender:"me",text:"genuinely obsessed, looking for a regular group"},{sender:"them",text:"Friday 7pm at Draughts in Hackney — you in?"}] },
];

export const MY_GROUPS = [
  { id:1, name:"Sunday Brunch Crew", emoji:"☀️", members:["Maya","Priya"], memberCount:6, unread:3, lastMsg:"Maya: anyone know a good spot in Hackney?", time:"5m", gradient:"linear-gradient(135deg,#FF6B6B,#FF8E53)" },
  { id:2, name:"Evening Run Club",   emoji:"🏃", members:["Dog Dad"],       memberCount:8, unread:1, lastMsg:"Dog Dad: pace group for Tuesday?",          time:"4h", gradient:"linear-gradient(135deg,#4ECDC4,#44A08D)" },
];

export const SUGGESTED_GROUPS = [
  { id:101, name:"Coffee & Catch-ups", emoji:"☕", memberCount:14, lastMsg:"Nora: anyone tried that new place on Bermondsey St?", time:"20m", gradient:"linear-gradient(135deg,#FF6B6B,#FF8E53)", reedReason:"Casual regular meetup — low pressure, good people" },
];
