export interface FlightInfo{
    direct: boolean;
    connecting: boolean;
}

export interface MatchTrip {
    id: string;
    homeTeam: string;
    awayTeam: string;
    matchDate: Date;
    city: string;
    iataCode: string;
    flightInfo: FlightInfo;
}
