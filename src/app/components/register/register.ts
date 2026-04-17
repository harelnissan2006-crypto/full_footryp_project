import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

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
      budgetLevel: [3],
      riskTolerance: [3],
      age: [null, [Validators.required, Validators.min(18), Validators.max(100)]],
    }, {
      validators: this.passwordMatchValidator
    });
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
}