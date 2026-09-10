import type { SeedPlayer } from './players';
import type { RookieRarity } from '../facilities';

export interface RookiePlayer extends SeedPlayer {
  rarity: RookieRarity;
  age: number;
}

export const ROOKIE_PLAYERS: RookiePlayer[] = [
  // Common
  { id: '30000000-0000-0000-0000-000000000001', name: 'Callum Hargreaves', real_team: 'Academy', position: 'GK', base_value: 8_000_000, current_market_value: 8_500_000, form_score: 6.40, injury_status: 'fit', contract_months_remaining: 48, rarity: 'common', age: 18 },
  { id: '30000000-0000-0000-0000-000000000002', name: 'Noah Fletcher', real_team: 'Academy', position: 'DEF', base_value: 9_000_000, current_market_value: 9_500_000, form_score: 6.50, injury_status: 'fit', contract_months_remaining: 48, rarity: 'common', age: 19 },
  { id: '30000000-0000-0000-0000-000000000003', name: 'Luis Navarro', real_team: 'Academy', position: 'DEF', base_value: 10_000_000, current_market_value: 10_500_000, form_score: 6.60, injury_status: 'fit', contract_months_remaining: 48, rarity: 'common', age: 18 },
  { id: '30000000-0000-0000-0000-000000000004', name: 'Jamie Okafor', real_team: 'Academy', position: 'MID', base_value: 11_000_000, current_market_value: 12_000_000, form_score: 6.70, injury_status: 'fit', contract_months_remaining: 48, rarity: 'common', age: 19 },
  { id: '30000000-0000-0000-0000-000000000005', name: 'Theo Marchand', real_team: 'Academy', position: 'MID', base_value: 10_000_000, current_market_value: 11_000_000, form_score: 6.55, injury_status: 'fit', contract_months_remaining: 48, rarity: 'common', age: 17 },
  { id: '30000000-0000-0000-0000-000000000006', name: 'Ryan Coles', real_team: 'Academy', position: 'FWD', base_value: 12_000_000, current_market_value: 13_000_000, form_score: 6.80, injury_status: 'fit', contract_months_remaining: 48, rarity: 'common', age: 18 },
  { id: '30000000-0000-0000-0000-000000000007', name: 'Mateo Ricci', real_team: 'Academy', position: 'DEF', base_value: 8_500_000, current_market_value: 9_000_000, form_score: 6.45, injury_status: 'fit', contract_months_remaining: 48, rarity: 'common', age: 19 },
  { id: '30000000-0000-0000-0000-000000000008', name: 'Kian Brooks', real_team: 'Academy', position: 'MID', base_value: 9_500_000, current_market_value: 10_000_000, form_score: 6.50, injury_status: 'fit', contract_months_remaining: 48, rarity: 'common', age: 18 },
  // Rare
  { id: '30000000-0000-0000-0000-000000000009', name: 'Elián Vargas', real_team: 'Academy', position: 'MID', base_value: 18_000_000, current_market_value: 22_000_000, form_score: 7.10, injury_status: 'fit', contract_months_remaining: 54, rarity: 'rare', age: 18 },
  { id: '30000000-0000-0000-0000-000000000010', name: 'Aisha Rahman', real_team: 'Academy', position: 'FWD', base_value: 20_000_000, current_market_value: 24_000_000, form_score: 7.20, injury_status: 'fit', contract_months_remaining: 54, rarity: 'rare', age: 17 },
  { id: '30000000-0000-0000-0000-000000000011', name: 'Oscar Lindqvist', real_team: 'Academy', position: 'DEF', base_value: 19_000_000, current_market_value: 23_000_000, form_score: 7.05, injury_status: 'fit', contract_months_remaining: 54, rarity: 'rare', age: 19 },
  { id: '30000000-0000-0000-0000-000000000012', name: 'Malik Touré', real_team: 'Academy', position: 'MID', base_value: 22_000_000, current_market_value: 26_000_000, form_score: 7.30, injury_status: 'fit', contract_months_remaining: 54, rarity: 'rare', age: 18 },
  { id: '30000000-0000-0000-0000-000000000013', name: 'Finn Gallagher', real_team: 'Academy', position: 'GK', base_value: 16_000_000, current_market_value: 19_000_000, form_score: 7.00, injury_status: 'fit', contract_months_remaining: 54, rarity: 'rare', age: 19 },
  { id: '30000000-0000-0000-0000-000000000014', name: 'Soren Blake', real_team: 'Academy', position: 'FWD', base_value: 21_000_000, current_market_value: 25_000_000, form_score: 7.15, injury_status: 'fit', contract_months_remaining: 54, rarity: 'rare', age: 17 },
  // Wonderkid
  { id: '30000000-0000-0000-0000-000000000015', name: 'Luka Petrovic', real_team: 'Academy', position: 'MID', base_value: 32_000_000, current_market_value: 40_000_000, form_score: 7.70, injury_status: 'fit', contract_months_remaining: 60, rarity: 'wonderkid', age: 17 },
  { id: '30000000-0000-0000-0000-000000000016', name: 'Amara Diallo', real_team: 'Academy', position: 'FWD', base_value: 36_000_000, current_market_value: 45_000_000, form_score: 7.85, injury_status: 'fit', contract_months_remaining: 60, rarity: 'wonderkid', age: 16 },
  { id: '30000000-0000-0000-0000-000000000017', name: 'Enzo Moretti', real_team: 'Academy', position: 'DEF', base_value: 30_000_000, current_market_value: 38_000_000, form_score: 7.60, injury_status: 'fit', contract_months_remaining: 60, rarity: 'wonderkid', age: 18 },
  { id: '30000000-0000-0000-0000-000000000018', name: 'Yusuf Demir', real_team: 'Academy', position: 'MID', base_value: 34_000_000, current_market_value: 42_000_000, form_score: 7.75, injury_status: 'fit', contract_months_remaining: 60, rarity: 'wonderkid', age: 17 },
];

export function rookiesByRarity(rarity: RookieRarity): RookiePlayer[] {
  return ROOKIE_PLAYERS.filter((p) => p.rarity === rarity);
}

export function findRookieById(id: string): RookiePlayer | undefined {
  return ROOKIE_PLAYERS.find((p) => p.id === id);
}
