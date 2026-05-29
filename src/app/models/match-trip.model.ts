export interface MatchDetails {
  home_team: string;
  away_team: string;
  home_crest: string;
  away_crest: string;
  match_date: string;
  match_time: string;
  flight_date: string;
  home_city: string;
  home_iata: string;
  distance_from_tlv: number;
  timezone: string;
}

export interface MatchTrip {
  _id: string;
  team: string;
  user_id: string;
  match: MatchDetails;
  competition: string;
  status: string;
  updated_at: string;
}