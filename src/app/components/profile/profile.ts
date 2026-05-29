import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import mappingData from '../../../../server/scripts/mapping.json'; 

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  profileForm!: FormGroup;
  isEditable: boolean = false;
  userId = localStorage.getItem('userId');
  isLoading: boolean = false;
  
  leagues = Object.keys(mappingData);
  selectedLeague: string = '';
  filteredTeams: any[] = [];

  // teams = Object.entries(mappingData).map(([name, info]) => ({
  //   id: info.team_id,
  //   name: name
  // })).sort((a, b) => a.name.localeCompare(b.name));

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.initForm();
  }

  initForm() {
    this.profileForm = this.formBuilder.group({
      username: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      favoriteTeamId: [null],
      otherInterestTeamsIds: [[]],
      budgetLevel: [3],
      riskTolerance: [3],
      age: [null]
    });
    this.profileForm.disable();
  }

  ngOnInit(): void {
    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadUserData();
  }

  loadUserData() {
    this.authService.getUser(this.userId!).subscribe({
      next: (userData) => {
        this.profileForm.patchValue(userData);
      },
      error: (err) => console.error('Error fetching user data:', err)
    });
  }

  onLeagueChange(event: any) {
    this.selectedLeague = event.target.value;
    if (this.selectedLeague) {
      const teamsInLeague = (mappingData as any)[this.selectedLeague];
      this.filteredTeams = Object.entries(teamsInLeague).map(([name, info]: [string, any]) => ({
        id: info.team_id,
        name: name
      })).sort((a, b) => a.name.localeCompare(b.name));
    } else {
      this.filteredTeams = [];
    }
  }

  getTeamNameById(id: number): string {
    for (const league of this.leagues) {
      const teamsInLeague = (mappingData as any)[league];
      const foundEntry = Object.entries(teamsInLeague).find(([_, info]: [any, any]) => info.team_id === id);
      if (foundEntry) {
        return foundEntry[0];
      }
    }
    return 'Unknown';
  }

  toggleEdit() {
    this.isEditable = !this.isEditable;
    if (this.isEditable) {
      this.profileForm.get('favoriteTeamId')?.enable();
      this.profileForm.get('otherInterestTeamsIds')?.enable();
      this.profileForm.get('budgetLevel')?.enable();
      this.profileForm.get('riskTolerance')?.enable();
      this.profileForm.get('age')?.enable();
    } else {
      this.profileForm.disable();
      this.selectedLeague = '';
      this.filteredTeams = [];
      this.loadUserData();
    }
  }

  saveChanges() {
    if (this.profileForm.valid && this.userId) {
      this.isLoading = true;
      const updatedData = this.profileForm.getRawValue();
      
      this.authService.updateUser(this.userId, updatedData).subscribe({
        next: (response) => {
          this.isLoading = false;
          alert('Profile and matches updated successfully!');
          this.isEditable = false;
          this.profileForm.disable();
          this.router.navigate(['/profile']);
        },
        error: (err) => {
          this.isLoading = false;
          alert('Error updating profile');
          console.error(err);
        }
      });
    }
  }

  getInterestTeamIds(): number[] {
    return this.profileForm.get('otherInterestTeamsIds')?.value || [];
  }

  addInterestTeam(event: any) {
    const teamId = parseInt(event.target.value);
    if(teamId && !this.getInterestTeamIds().includes(teamId)){
      const updatedIds = [...this.getInterestTeamIds(), teamId];
      this.profileForm.get('otherInterestTeamsIds')?.setValue(updatedIds);
      this.profileForm.get('otherInterestTeamsIds')?.markAsDirty();
    }
    event.target.value = '';
  }
  removeInterestTeam(teamId: number) {
    const updatedIds = this.getInterestTeamIds().filter((id: number) => id !== teamId);
    this.profileForm.get('otherInterestTeamsIds')?.setValue(updatedIds);
    this.profileForm.get('otherInterestTeamsIds')?.markAsDirty();
  }
}