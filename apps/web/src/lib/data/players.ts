export interface SeedPlayer {
  id: string;
  name: string;
  real_team: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  base_value: number;
  current_market_value: number;
  form_score: number;
  injury_status: string;
  contract_months_remaining: number;
}

export const SAMPLE_PLAYERS: SeedPlayer[] = [
  // Goalkeepers (5)
  { id: '10000000-0000-0000-0000-000000000001', name: 'David Raya', real_team: 'Arsenal', position: 'GK', base_value: 40000000, current_market_value: 46000000, form_score: 7.60, injury_status: 'fit', contract_months_remaining: 36 },
  { id: '10000000-0000-0000-0000-000000000002', name: 'Ederson', real_team: 'Manchester City', position: 'GK', base_value: 35000000, current_market_value: 38000000, form_score: 7.20, injury_status: 'fit', contract_months_remaining: 24 },
  { id: '10000000-0000-0000-0000-000000000003', name: 'Alisson Becker', real_team: 'Liverpool', position: 'GK', base_value: 42000000, current_market_value: 40000000, form_score: 7.40, injury_status: 'minor_knock', contract_months_remaining: 24 },
  { id: '10000000-0000-0000-0000-000000000004', name: 'Emiliano Martínez', real_team: 'Aston Villa', position: 'GK', base_value: 38000000, current_market_value: 42000000, form_score: 7.50, injury_status: 'fit', contract_months_remaining: 36 },
  { id: '10000000-0000-0000-0000-000000000005', name: 'Guglielmo Vicario', real_team: 'Tottenham Hotspur', position: 'GK', base_value: 32000000, current_market_value: 35000000, form_score: 7.10, injury_status: 'fit', contract_months_remaining: 42 },

  // Defenders (10)
  { id: '10000000-0000-0000-0000-000000000006', name: 'William Saliba', real_team: 'Arsenal', position: 'DEF', base_value: 75000000, current_market_value: 85000000, form_score: 7.90, injury_status: 'fit', contract_months_remaining: 36 },
  { id: '10000000-0000-0000-0000-000000000007', name: 'Gabriel Magalhães', real_team: 'Arsenal', position: 'DEF', base_value: 65000000, current_market_value: 72000000, form_score: 7.70, injury_status: 'fit', contract_months_remaining: 36 },
  { id: '10000000-0000-0000-0000-000000000008', name: 'Trent Alexander-Arnold', real_team: 'Liverpool', position: 'DEF', base_value: 70000000, current_market_value: 75000000, form_score: 7.60, injury_status: 'fit', contract_months_remaining: 12 },
  { id: '10000000-0000-0000-0000-000000000009', name: 'Virgil van Dijk', real_team: 'Liverpool', position: 'DEF', base_value: 45000000, current_market_value: 48000000, form_score: 7.80, injury_status: 'fit', contract_months_remaining: 12 },
  { id: '10000000-0000-0000-0000-000000000010', name: 'Joško Gvardiol', real_team: 'Manchester City', position: 'DEF', base_value: 75000000, current_market_value: 80000000, form_score: 7.50, injury_status: 'fit', contract_months_remaining: 48 },
  { id: '10000000-0000-0000-0000-000000000011', name: 'Rúben Dias', real_team: 'Manchester City', position: 'DEF', base_value: 70000000, current_market_value: 72000000, form_score: 7.40, injury_status: 'fit', contract_months_remaining: 36 },
  { id: '10000000-0000-0000-0000-000000000012', name: 'Cristian Romero', real_team: 'Tottenham Hotspur', position: 'DEF', base_value: 60000000, current_market_value: 65000000, form_score: 7.30, injury_status: 'fit', contract_months_remaining: 36 },
  { id: '10000000-0000-0000-0000-000000000013', name: 'Pedro Porro', real_team: 'Tottenham Hotspur', position: 'DEF', base_value: 45000000, current_market_value: 50000000, form_score: 7.40, injury_status: 'fit', contract_months_remaining: 40 },
  { id: '10000000-0000-0000-0000-000000000014', name: 'Micky van de Ven', real_team: 'Tottenham Hotspur', position: 'DEF', base_value: 55000000, current_market_value: 62000000, form_score: 7.50, injury_status: 'fit', contract_months_remaining: 46 },
  { id: '10000000-0000-0000-0000-000000000015', name: 'Levi Colwill', real_team: 'Chelsea', position: 'DEF', base_value: 50000000, current_market_value: 54000000, form_score: 7.20, injury_status: 'fit', contract_months_remaining: 48 },

  // Midfielders (10)
  { id: '10000000-0000-0000-0000-000000000016', name: 'Bukayo Saka', real_team: 'Arsenal', position: 'MID', base_value: 110000000, current_market_value: 125000000, form_score: 8.20, injury_status: 'fit', contract_months_remaining: 36 },
  { id: '10000000-0000-0000-0000-000000000017', name: 'Martin Ødegaard', real_team: 'Arsenal', position: 'MID', base_value: 90000000, current_market_value: 95000000, form_score: 7.80, injury_status: 'fit', contract_months_remaining: 40 },
  { id: '10000000-0000-0000-0000-000000000018', name: 'Declan Rice', real_team: 'Arsenal', position: 'MID', base_value: 95000000, current_market_value: 105000000, form_score: 7.90, injury_status: 'fit', contract_months_remaining: 44 },
  { id: '10000000-0000-0000-0000-000000000019', name: 'Rodri', real_team: 'Manchester City', position: 'MID', base_value: 115000000, current_market_value: 100000000, form_score: 8.40, injury_status: 'severe_injury', contract_months_remaining: 36 },
  { id: '10000000-0000-0000-0000-000000000020', name: 'Kevin De Bruyne', real_team: 'Manchester City', position: 'MID', base_value: 60000000, current_market_value: 55000000, form_score: 7.70, injury_status: 'fit', contract_months_remaining: 12 },
  { id: '10000000-0000-0000-0000-000000000021', name: 'Phil Foden', real_team: 'Manchester City', position: 'MID', base_value: 110000000, current_market_value: 118000000, form_score: 7.80, injury_status: 'fit', contract_months_remaining: 36 },
  { id: '10000000-0000-0000-0000-000000000022', name: 'Cole Palmer', real_team: 'Chelsea', position: 'MID', base_value: 85000000, current_market_value: 110000000, form_score: 8.50, injury_status: 'fit', contract_months_remaining: 60 },
  { id: '10000000-0000-0000-0000-000000000023', name: 'Bruno Fernandes', real_team: 'Manchester United', position: 'MID', base_value: 65000000, current_market_value: 68000000, form_score: 7.50, injury_status: 'fit', contract_months_remaining: 36 },
  { id: '10000000-0000-0000-0000-000000000024', name: 'Kobbie Mainoo', real_team: 'Manchester United', position: 'MID', base_value: 45000000, current_market_value: 55000000, form_score: 7.40, injury_status: 'fit', contract_months_remaining: 40 },
  { id: '10000000-0000-0000-0000-000000000025', name: 'Alexis Mac Allister', real_team: 'Liverpool', position: 'MID', base_value: 70000000, current_market_value: 78000000, form_score: 7.60, injury_status: 'fit', contract_months_remaining: 40 },

  // Forwards (5)
  { id: '10000000-0000-0000-0000-000000000026', name: 'Erling Haaland', real_team: 'Manchester City', position: 'FWD', base_value: 150000000, current_market_value: 180000000, form_score: 8.80, injury_status: 'fit', contract_months_remaining: 36 },
  { id: '10000000-0000-0000-0000-000000000027', name: 'Mohamed Salah', real_team: 'Liverpool', position: 'FWD', base_value: 80000000, current_market_value: 85000000, form_score: 8.40, injury_status: 'fit', contract_months_remaining: 12 },
  { id: '10000000-0000-0000-0000-000000000028', name: 'Alexander Isak', real_team: 'Newcastle United', position: 'FWD', base_value: 75000000, current_market_value: 85000000, form_score: 7.80, injury_status: 'fit', contract_months_remaining: 40 },
  { id: '10000000-0000-0000-0000-000000000029', name: 'Ollie Watkins', real_team: 'Aston Villa', position: 'FWD', base_value: 65000000, current_market_value: 72000000, form_score: 7.60, injury_status: 'fit', contract_months_remaining: 44 },
  { id: '10000000-0000-0000-0000-000000000030', name: 'Son Heung-min', real_team: 'Tottenham Hotspur', position: 'FWD', base_value: 50000000, current_market_value: 52000000, form_score: 7.50, injury_status: 'fit', contract_months_remaining: 18 }
];
