import { Component, OnInit } from '@angular/core';
import { MatchesService } from '../../services/matches.service';
import { MatchTrip } from '../../models/match-trip.model';
import { CommonModule } from '@angular/common';
import { GameCard } from '../game-card/game-card';

@Component({
  selector: 'app-matches-list',
  standalone: true,
  imports: [CommonModule, GameCard],
  templateUrl: './matches-list.html',
  styleUrl: './matches-list.css'
})
export class MatchesList implements OnInit {
  matches: MatchTrip[] = [];
  isLoading: boolean = true;
  userId = localStorage.getItem('userId');

  constructor(private matchesService: MatchesService) {}

  ngOnInit(): void {
    if (this.userId) {
      this.loadMatches();
    }
  }

  loadMatches(): void {
    this.isLoading = true;
    this.matchesService.getSuggestions(this.userId!).subscribe({
      next: (data) => {
        this.matches = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('שגיאה בטעינת משחקים:', err);
        this.isLoading = false;
        this.matches = [];
      }
    });
  }

  get groupedMatches(): { team: string; matches: MatchTrip[] }[] {
  const groups = new Map<string, MatchTrip[]>();
  
  for (const match of this.matches) {
    const team = match.team;
    if (!groups.has(team)) {
      groups.set(team, []);
    }
    groups.get(team)!.push(match);
  }
  
  return Array.from(groups.entries()).map(([team, matches]) => ({ team, matches }));
  }

}