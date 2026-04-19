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
  
  teams = Object.entries(mappingData).map(([name, info]) => ({
    id: info.team_id,
    name: name
  })).sort((a, b) => a.name.localeCompare(b.name));

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

  toggleEdit() {
    this.isEditable = !this.isEditable;
    if (this.isEditable) {
      this.profileForm.get('favoriteTeamId')?.enable();
      this.profileForm.get('budgetLevel')?.enable();
      this.profileForm.get('riskTolerance')?.enable();
      this.profileForm.get('age')?.enable();
    } else {
      this.profileForm.disable();
      this.loadUserData();
    }
  }

  saveChanges() {
    if (this.profileForm.valid && this.userId) {
      const updatedData = this.profileForm.getRawValue();
      this.authService.updateUser(this.userId, updatedData).subscribe({
        next: () => {
          alert('הפרופיל עודכן בהצלחה!');
          this.isEditable = false;
          this.profileForm.disable();
        },
        error: () => alert('שגיאה בעדכון הנתונים')
      });
    }
  }
}