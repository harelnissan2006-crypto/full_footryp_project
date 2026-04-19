import { Component, Input, OnInit } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { MatchTrip } from '../../models/match-trip.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [DatePipe, CommonModule, RouterModule],
  templateUrl: './game-card.html',
  styleUrls: ['./game-card.css'],
})
export class GameCard implements OnInit {
  @Input() matchTrip!: MatchTrip;

  constructor() { }

  ngOnInit(): void {
    if (!this.matchTrip) {
      console.error('GameCard: matchTrip is undefined');
    }
  }

  getFlightInfo(): string {
  if (!this.matchTrip) return 'Loading...';
  
  const flight = this.matchTrip.match?.flight_availability;
  
  if (flight?.direct) return 'Direct Flight';
  if (flight?.connecting) return 'Connecting Flight';
  if (flight?.status === 'too_soon') return 'Too early for flight prices';
  
  return 'No Flight Information';
  }
}