import { Component, OnInit } from '@angular/core';
import { MatchesService } from '../../services/matches.service';
import { MatchTrip } from '../../models/match-trip.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameCard } from '../game-card/game-card';

@Component({
  selector: 'app-matches-list',
  standalone: true,
  imports: [CommonModule, GameCard, FormsModule],
  templateUrl: './matches-list.html',
  styleUrl: './matches-list.css'
})
export class MatchesList implements OnInit {
    matches: MatchTrip[] = [];
    isLoading: boolean = true;
    userId = localStorage.getItem('userId');
    filterDate: string = '';
    filterCompetition: string = '';
    competitions: string[] = [];

    constructor(private matchesService: MatchesService) {}

    ngOnInit(): void {
        if (this.userId) {
            this.loadCompetitions();
            this.loadMatches();
        }
    }

    loadCompetitions(): void {
        this.matchesService.getCompetitions(this.userId!).subscribe({
            next: (data) => { this.competitions = data; },
            error: (err) => console.error('Error loading competitions:', err)
        });
    }

    loadMatches(): void {
        this.isLoading = true;
        this.matchesService.getSuggestions(
            this.userId!,
            this.filterDate || undefined,
            this.filterCompetition || undefined
        ).subscribe({
            next: (data) => {
                this.matches = data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading matches', err);
                this.isLoading = false;
                this.matches = [];
            }
        });
    }

    clearFilters(): void {
        this.filterDate = '';
        this.filterCompetition = '';
        this.loadMatches();
    }

    get groupedMatches(): { team: string; matches: MatchTrip[] }[] {
        const groups = new Map<string, MatchTrip[]>();
        for (const match of this.matches) {
            const team = match.team;
            if (!groups.has(team)) groups.set(team, []);
            groups.get(team)!.push(match);
        }
        return Array.from(groups.entries()).map(([team, matches]) => ({ team, matches }));
    }
}