import { Component, Input, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatchTrip } from '../../models/match-trip.model';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-game-card',
  imports: [DatePipe, NgClass],
  templateUrl: './game-card.html',
  styleUrls: ['./game-card.css'],
})
export class GameCard implements OnInit {
  @Input() matchTrip!: MatchTrip;

  constructor() { }

  ngOnInit(): void {
  }

  getFlightInfo(): string {
    if (this.matchTrip.flightInfo.direct) {
      return 'Direct Flight';
    }
    if (this.matchTrip.flightInfo.connecting) {
      return 'Connecting Flight';
    }
    return 'No Flight Information Available'; 
  }

}
