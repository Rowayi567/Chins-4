export const SUPABASE_URL = 'https://gwtkmvctvycebrvylgzo.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3dGttdmN0dnljZWJydnlsZ3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MzQ1ODksImV4cCI6MjA5MDMxMDU4OX0.-QU-y7bJ9tKgqKPxTafRebRR_NWdgxdkydcuq5Lzlxw';

export const sb = {
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
    const r = await fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.' + userId, {
      method: 'PATCH',
      headers: { ...sb.authHeaders(token), 'Prefer': 'return=minimal' },
      body: JSON.stringify(data)
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
  }
};
