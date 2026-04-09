export default function TabIcon({ id, active }) {
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
