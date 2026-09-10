import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { SAMPLE_PLAYERS, type SeedPlayer } from './data/players';

export interface UserSession {
  id: string;
  email: string;
}

export interface ClubSession {
  id: string;
  user_id: string;
  club_name: string;
  badge_url: string;
  colors: {
    primary: string;
    secondary: string;
  };
  home_ground_name: string;
  virtual_purse_balance: number;
  total_squad_value: number;
  academy_level: number;
  scouting_level: number;
  stadium_level: number;
  created_at?: string;
}

export interface RosterItem {
  id: string;
  club_id: string;
  player_id: string;
  acquisition_price: number;
  acquired_at: string;
  in_starting_xi: boolean;
  player: SeedPlayer;
}

const DEMO_USER_COOKIE = 'gafferdex_demo_user';
const DEMO_CLUB_COOKIE = 'gafferdex_demo_club';
const DEMO_ROSTER_COOKIE = 'gafferdex_demo_roster';

export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const supabase = createClient();

  // 1. Try real Supabase auth first
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id) {
      return { id: user.id, email: user.email || 'gaffer@club.com' };
    }
  } catch {
    // Supabase not reachable or placeholder
  }

  // 2. Check demo user cookie
  const demoCookie = cookieStore.get(DEMO_USER_COOKIE)?.value;
  if (demoCookie) {
    try {
      return JSON.parse(demoCookie);
    } catch {
      return null;
    }
  }

  return null;
}

export async function setDemoUserSession(email: string): Promise<UserSession> {
  const cookieStore = cookies();
  // Create deterministic stable ID based on email
  const cleanEmail = email.trim().toLowerCase();
  const user: UserSession = {
    id: `usr_${Buffer.from(cleanEmail).toString('hex').substring(0, 16)}`,
    email: cleanEmail,
  };

  cookieStore.set(DEMO_USER_COOKIE, JSON.stringify(user), {
    path: '/',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return user;
}

export async function clearUserSession() {
  const cookieStore = cookies();
  const supabase = createClient();

  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  }

  cookieStore.set(DEMO_USER_COOKIE, '', { path: '/', maxAge: 0 });
}

export async function getClubForUser(userId: string): Promise<ClubSession | null> {
  const cookieStore = cookies();
  const supabase = createClient();

  // 1. Try real Supabase query
  try {
    const { data: club, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && club) {
      return club as ClubSession;
    }
  } catch {
    // ignore
  }

  // 2. Check demo club cookie
  const clubCookie = cookieStore.get(DEMO_CLUB_COOKIE)?.value;
  if (clubCookie) {
    try {
      const club: ClubSession = JSON.parse(clubCookie);
      if (club.user_id === userId) {
        return club;
      }
    } catch {
      return null;
    }
  }

  return null;
}

export async function saveClubSession(clubData: Omit<ClubSession, 'id'>): Promise<ClubSession> {
  const cookieStore = cookies();
  const supabase = createClient();

  const club: ClubSession = {
    ...clubData,
    id: `clb_${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  // Try saving to real Supabase
  try {
    await supabase.from('clubs').insert({
      user_id: club.user_id,
      club_name: club.club_name,
      badge_url: club.badge_url,
      colors: club.colors,
      home_ground_name: club.home_ground_name,
      virtual_purse_balance: club.virtual_purse_balance,
      total_squad_value: club.total_squad_value,
      academy_level: club.academy_level,
      scouting_level: club.scouting_level,
      stadium_level: club.stadium_level,
    });
  } catch {
    // ignore fallback
  }

  // Always persist to demo cookie so session stays alive
  cookieStore.set(DEMO_CLUB_COOKIE, JSON.stringify(club), {
    path: '/',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
  });

  return club;
}

export async function updateClubPurse(userId: string, newPurse: number, newSquadValue: number) {
  const cookieStore = cookies();
  const supabase = createClient();

  // 1. Update Supabase if available
  try {
    await supabase
      .from('clubs')
      .update({
        virtual_purse_balance: newPurse,
        total_squad_value: newSquadValue,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } catch {
    // ignore
  }

  // 2. Update demo cookie
  const clubCookie = cookieStore.get(DEMO_CLUB_COOKIE)?.value;
  if (clubCookie) {
    try {
      const club: ClubSession = JSON.parse(clubCookie);
      if (club.user_id === userId) {
        club.virtual_purse_balance = newPurse;
        club.total_squad_value = newSquadValue;
        cookieStore.set(DEMO_CLUB_COOKIE, JSON.stringify(club), {
          path: '/',
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 30,
        });
      }
    } catch {
      // ignore
    }
  }
}

export async function getClubRoster(clubId: string): Promise<RosterItem[]> {
  const cookieStore = cookies();
  const supabase = createClient();

  // 1. Try Supabase
  try {
    const { data: dbRoster } = await supabase
      .from('club_roster')
      .select('id, club_id, player_id, acquisition_price, acquired_at, in_starting_xi, players (*)')
      .eq('club_id', clubId);

    if (dbRoster && dbRoster.length > 0) {
      return dbRoster.map((item: any) => ({
        id: item.id,
        club_id: item.club_id,
        player_id: item.player_id,
        acquisition_price: Number(item.acquisition_price),
        acquired_at: item.acquired_at,
        in_starting_xi: Boolean(item.in_starting_xi),
        player: item.players,
      }));
    }
  } catch {
    // ignore
  }

  // 2. Fallback to demo roster cookie
  const rosterCookie = cookieStore.get(DEMO_ROSTER_COOKIE)?.value;
  if (rosterCookie) {
    try {
      const storedList: Array<{ id: string; club_id: string; player_id: string; acquisition_price: number; acquired_at: string; in_starting_xi: boolean }> = JSON.parse(rosterCookie);
      const filtered = storedList.filter(r => r.club_id === clubId);
      return filtered.map(r => {
        const player = SAMPLE_PLAYERS.find(p => p.id === r.player_id) || {
          id: r.player_id,
          name: 'Player',
          real_team: 'Premier League',
          position: 'MID' as const,
          base_value: r.acquisition_price,
          current_market_value: r.acquisition_price,
          form_score: 7.0,
          injury_status: 'fit',
          contract_months_remaining: 24,
        };
        return {
          ...r,
          player,
        };
      });
    } catch {
      return [];
    }
  }

  return [];
}

export async function addPlayerToRoster(clubId: string, player: SeedPlayer) {
  const cookieStore = cookies();
  const supabase = createClient();

  const entry = {
    id: `rst_${Date.now()}`,
    club_id: clubId,
    player_id: player.id,
    acquisition_price: player.current_market_value,
    acquired_at: new Date().toISOString(),
    in_starting_xi: false,
  };

  // Try Supabase insert
  try {
    await supabase.from('club_roster').insert(entry);
    await supabase.from('market_transactions').insert({
      buyer_club_id: clubId,
      player_id: player.id,
      fee: player.current_market_value,
      transaction_type: 'market_buy',
    });
  } catch {
    // ignore
  }

  // Update demo cookie
  let list: any[] = [];
  const rosterCookie = cookieStore.get(DEMO_ROSTER_COOKIE)?.value;
  if (rosterCookie) {
    try {
      list = JSON.parse(rosterCookie);
    } catch {
      list = [];
    }
  }
  list.unshift(entry);
  cookieStore.set(DEMO_ROSTER_COOKIE, JSON.stringify(list), {
    path: '/',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function removePlayerFromRoster(clubId: string, playerId: string) {
  const cookieStore = cookies();
  const supabase = createClient();

  try {
    await supabase.from('club_roster').delete().eq('club_id', clubId).eq('player_id', playerId);
  } catch {
    // ignore
  }

  const rosterCookie = cookieStore.get(DEMO_ROSTER_COOKIE)?.value;
  if (rosterCookie) {
    try {
      const list: any[] = JSON.parse(rosterCookie);
      const filtered = list.filter(r => !(r.club_id === clubId && r.player_id === playerId));
      cookieStore.set(DEMO_ROSTER_COOKIE, JSON.stringify(filtered), {
        path: '/',
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
      });
    } catch {
      // ignore
    }
  }
}
