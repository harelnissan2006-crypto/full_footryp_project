import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import mappingData from '../../../../server/scripts/mapping.json';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register implements OnInit {
  teams: any[] = [];
  registerForm!: FormGroup;
  isLoading = false;

  leagues = Object.keys(mappingData);
  selectedLeagueFavorite: string = '';
  selectedLeagueInterest: string = '';
  filteredTeamsFavorite: any[] = [];
  filteredTeamsInterest: any[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTeams();
    this.initForm();
  }

  loadTeams(): void {
    this.authService.getTeams().subscribe({
      next: (data) => {
        this.teams = data;
      },
      error: (error) => {
        console.error('Failed to load teams', error);
      }
    });
  }

  initForm(): void {
    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      favoriteTeamId: [null, [Validators.required]],
      otherInterestTeamsIds: [[]],
      budgetLevel: [3],
      riskTolerance: [3],
      age: [null, [Validators.required, Validators.min(18), Validators.max(100)]],
    }, {
      validators: this.passwordMatchValidator
    });
  }

  onLeagueChangeFavorite(event: any) {
    this.selectedLeagueFavorite = event.target.value;
    if(this.selectedLeagueFavorite){
      const teamsObj = (mappingData as any)[this.selectedLeagueFavorite];
      this.filteredTeamsFavorite = Object.entries(teamsObj).map(([name, info]: [string, any]) => ({
        id: info.team_id,
        name: name 
      })).sort((a,b)=>a.name.localeCompare(b.name));
    }else{
      this.filteredTeamsFavorite = [];
    }
  }

  onLeagueChangeInterest(event: any) {
    this.selectedLeagueInterest = event.target.value;
    if (this.selectedLeagueInterest) {
      const teamsObj = (mappingData as any)[this.selectedLeagueInterest];
      this.filteredTeamsInterest = Object.entries(teamsObj).map(([name, info]: [string, any]) => ({
        id: info.team_id,
        name: name
      })).sort((a, b) => a.name.localeCompare(b.name));
    } else {
      this.filteredTeamsInterest = [];
    }
  }

  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { 'mismatch': true };
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.authService.register(this.registerForm.value).subscribe({
        next: (response: any) => {
          console.log('User registered successfully');
          alert('Registration successful! Please log in.');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Registration failed', error);
        }
      });
    } else {
      console.log('Form is invalid');
    }
  }

  goBackToLogin() {
    this.router.navigate(['/login']);
  }

  getInterestTeamIds(): number[] {
    return this.registerForm.get('otherInterestTeamsIds')?.value || [];
  }
  getTeamNameById(id: number): string {
    const team = this.teams.find(t => t.id === id);
    if (team) return team.name;

    for (const league of this.leagues) {
      const teamsInLeague = (mappingData as any)[league];
      const found = Object.entries(teamsInLeague).find(([_, info]: [any, any]) => info.team_id === id);
      if (found) return found[0];
    }
    return 'Unknown';
  }

  addInterestTeam(event: any) {
    const teamId = parseInt(event.target.value);
    if(teamId && !this.getInterestTeamIds().includes(teamId)){
      const updatedIds = [...this.getInterestTeamIds(), teamId];
      this.registerForm.get('otherInterestTeamsIds')?.setValue(updatedIds);
      this.registerForm.get('otherInterestTeamsIds')?.markAsDirty();
    }
    event.target.value = '';
  }
  removeInterestTeam(teamId: number) {
    const updatedIds = this.getInterestTeamIds().filter((id: number) => id !== teamId);
    this.registerForm.get('otherInterestTeamsIds')?.setValue(updatedIds);
    this.registerForm.get('otherInterestTeamsIds')?.markAsDirty();
  }
}