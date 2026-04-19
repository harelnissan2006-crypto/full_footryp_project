export interface FlightAvailability {
  direct: boolean;
  connecting: boolean;
  status: string;
  price?: number;
}

export interface MatchDetails {
  home_team: string;
  away_team: string;
  match_date: string;
  match_time: string;
  flight_date: string;
  home_city: string;
  home_iata: string;
  risk_level: string;
  flight_availability: FlightAvailability;
}

export interface MatchTrip {
  _id: string;
  team: string;
  user_id: string;
  match: MatchDetails;
  status: string;
  updated_at: string;
  flight_availability: FlightAvailability; 
}