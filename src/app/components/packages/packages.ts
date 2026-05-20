import { Component, OnInit } from '@angular/core';
import {CommonModule} from "@angular/common";
import {ActivatedRoute, Router} from "@angular/router";
import {PackagesService} from "../../services/packages.service";
import {MatchesService} from "../../services/matches.service";

@Component({
  selector: 'app-packages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './packages.html',
  styleUrl: './packages.css',
})
export class Packages implements OnInit {
  matchId: string = '';
  userId: string = '';
  packages: any[] = [];
  matchData: any = null;
  isLoading: boolean = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private packagesService: PackagesService,
    private matchesService: MatchesService
  ) {}

  ngOnInit(): void {
    this.matchId = this.route.snapshot.paramMap.get('matchId') || '';
    this.userId = localStorage.getItem('userId') || '';

    if(!this.userId){
      this.router.navigate(['/login']);
      return;
    }
    this.matchesService.getSuggestions(this.userId).subscribe({
      next: (matches) => {
        console.log('DEBUG matchId from route:', this.matchId);
        console.log('DEBUG all match IDs:', matches.map(m => m._id));
        const match = matches.find(m => String(m._id) === String(this.matchId));
        console.log('DEBUG found match:', match);
        if(!match){
          this.error = 'Match not found';
          this.isLoading = false;
          return;
        }
        this.matchData = match;

        this.packagesService.getPackages(this.userId, this.matchData).subscribe({
          next: (result) => {
            this.packages = result.packages || [];
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error fetching packages:', err);
            this.error = 'Failed to load packages. Please try again later.';
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error fetching matches:', err);
        this.error = 'Failed to load match data. Please try again later.';
        this.isLoading = false;
      }
    });
  }
  goBack(): void{
    this.router.navigate(['/matches']);
  }
  getScoreColor(score: number): string {
    if (score >= 70){
      return '#2e7d32';
    } 
    if (score >= 40){
      return '#f57c00';
    }
    return '#c62828';
  }
  getStopsLabel(stops: number): string {
    if (stops === 0) {
      return 'Direct';
    }
    if (stops === 1) {
      return '1 Stop';
    }
    return `${stops} Stops`;
  }
  getRatingStars(rating: number): string {
    return '⭐'.repeat(Math.min(rating, 5));
  }
}
