'use server';

const API_BASE_URL = process.env.API_URL || 'http://127.0.0.1:8000';

export interface PriceHistoryPoint {
  player_id: string;
  market_value: number;
  form_factor: number;
  rumor_multiplier: number;
  demand_factor: number;
  match_rating: number;
  recorded_at: string;
  label: string;
}

export async function fetchPriceHistoryAction(
  playerId: string,
  timeframe: '7d' | '30d' | 'season' = '7d'
): Promise<{ success: boolean; data?: PriceHistoryPoint[]; error?: string }> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/jobs/history/${playerId}?timeframe=${timeframe}`,
      {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!res.ok) {
      return { success: false, error: 'Failed to fetch price history from API engine.' };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error fetching price history.' };
  }
}
