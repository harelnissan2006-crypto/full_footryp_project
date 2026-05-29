import { Component, Input, OnInit } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { MatchTrip } from '../../models/match-trip.model';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [DatePipe, CommonModule, RouterModule],
  templateUrl: './game-card.html',
  styleUrls: ['./game-card.css'],
})
export class GameCard implements OnInit {
  @Input() matchTrip!: MatchTrip;
  localTime: string = '';

  constructor(private router: Router) { }

  ngOnInit(): void {
    if (!this.matchTrip) {
      console.error('GameCard: matchTrip is undefined');
      return;
    }
    this.localTime = this.convertToLocalTime();
  }

  // getFlightInfo(): string {
  // if (!this.matchTrip) return 'Loading...';
  
  // const flight = this.matchTrip.match?.flight_availability;
  
  // if (flight?.direct) return 'Direct Flight';
  // if (flight?.connecting) return 'Connecting Flight';
  // if (flight?.status === 'too_soon') return 'Too early for flight prices';
  
  // return 'No Flight Information';
  // }

  findPackage(): void{
    const matchId = this.matchTrip._id;
    this.router.navigate(['/packages', matchId])
  }

  convertToLocalTime(): string{
    try{
      const {match_date, match_time, timezone} = this.matchTrip.match;
      if(!match_time || match_time === '00:00:00') return 'TBD';

      const utcDate = new Date(`${match_date}T${match_time}Z`);
      return utcDate.toLocaleTimeString('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit'
      });
    }catch{
      return this.matchTrip.match.match_time?.slice(0,5) || 'TBD';
    }

  }
}