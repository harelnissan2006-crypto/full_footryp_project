import { MatchTrip } from "./models/match-trip.model";
export const MOCK: MatchTrip[] = [
    {
        id: '1',
        homeTeam: 'Manchester City',
        awayTeam: 'Real Madrid',
        matchDate: new Date('2026-03-28'),
        city: 'Manchester',
        iataCode: 'MAN',
        flightInfo: { direct: false, connecting: true }
    },
    {
    id: '102',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Arsenal',
    matchDate: new Date('2026-04-02'),
    city: 'Munich',
    iataCode: 'MUC',
    flightInfo: { direct: false, connecting: true }
  },
  {
    id: '103',
    homeTeam: 'Barcelona',
    awayTeam: 'PSG',
    matchDate: new Date('2026-04-08'),
    city: 'Barcelona',
    iataCode: 'BCN',
    flightInfo: { direct: true, connecting: true }
  },
  {
    id: '104',
    homeTeam: 'Liverpool',
    awayTeam: 'AC Milan',
    matchDate: new Date('2026-04-15'),
    city: 'Liverpool',
    iataCode: 'LPL',
    flightInfo: { direct: false, connecting: false }
  }
]