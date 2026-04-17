import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameCard } from '../game-card/game-card';
import { MatchTrip } from '../../models/match-trip.model';
import { MatchesService } from '../../services/matches.service';

@Component({
  selector: 'app-matches-list',
  standalone: true,
  imports: [CommonModule, GameCard],
  templateUrl: './matches-list.html',
  styleUrl: './matches-list.css',
})
export class MatchesList implements OnInit {
  suggestedMatches: MatchTrip[] = [];
  isLoading: boolean = true;

  constructor(private matchService: MatchesService) {}

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.matchService.getSuggestions(userId).subscribe({
        next: (matches: any[]) => {
          this.suggestedMatches = matches.map(match => {
            return{
              id: match._id,
              homeTeam: match.homeTeam,
              awayTeam: match.awayTeam,
              matchDate: match.match_date
            } as MatchTrip
            });
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching match suggestions:', err);
          this.isLoading = false;
        }
      });
    }
    else{
      this.isLoading = false;
    }
  }
}
