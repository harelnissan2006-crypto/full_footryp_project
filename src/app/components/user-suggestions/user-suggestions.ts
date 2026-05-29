import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AuthService} from "../../services/auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-user-suggestions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-suggestions.html',
  styleUrl: './user-suggestions.css',
})
export class UserSuggestions implements OnInit {
  suggestions: any[] = [];
  isLoading: boolean = true;
  userId = localStorage.getItem('userId');
  teamsMap: Map<number, string> = new Map();

  constructor(private authService: AuthService, private router: Router) {}

  openDM(username: string): void{
    this.router.navigate(['/dm', username], { queryParams: { from: 'travelCompanions' } });
  }

  ngOnInit(): void{
    if(!this.userId){
      this.router.navigate(['/login']);
      return;
    }
    this.authService.getTeams().subscribe({
      next: (teams: any[]) => {
        teams.forEach(t => this.teamsMap.set(t.id, t.name));
        this.loadSuggestions();
      },
      error: () => this.loadSuggestions()
    });
  }
  loadSuggestions(): void{
    this.authService.getSuggestions(this.userId!).subscribe({
      next: (data) => {
        this.suggestions = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching suggestions:', err);
        this.isLoading = false;
      }
    });
  }
  getTeamName(teamId: number): string{
    return this.teamsMap.get(teamId) || 'Unknown';
  }
  getScoreColor(score: number): string {
    if (score >=70) return '#2e7d32';
    if (score >=40) return '#f57c00';
    return '#c62828';
  }
}
