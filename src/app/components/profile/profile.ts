import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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

    teams = [
      { id: 1, name: 'Real Madrid' }, 
      { id: 2, name: 'Barcelona' }, 
      { id: 3, name: 'Manchester City' }, 
      { id: 4, name: 'Bayern Munich' },
      { id: 5, name: 'Liverpool' }];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.initForm();
  }

  initForm(){
    this.profileForm = this.formBuilder.group({
      username: [{value: '', disabled: true}],
      email: [{value: '', disabled: true}],
      favoriteTeamId: [null],
      budgetLevel: [3],
      riskTolerance: [3],
      age: [null]
    });
    this.profileForm.disable();
  }

  ngOnInit(): void {
    if(!this.userId){
      this.router.navigate(['/login']);
      return;
    }
  }

  loadUserData(){
    this.authService.getUser(this.userId!).subscribe(userData => {
      this.profileForm.patchValue(userData);
    });
  }

  toggleEdit(){
    this.isEditable = !this.isEditable;
    if (this.isEditable) {
      this.profileForm.get('favoriteTeamId')?.enable();
      this.profileForm.get('budgetLevel')?.enable();
      this.profileForm.get('riskTolerance')?.enable();
      this.profileForm.get('age')?.enable();
    }else {
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
