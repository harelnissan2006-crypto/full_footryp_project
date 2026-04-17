import { Component } from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;

  constructor(
    private authService: AuthService,
    private router: Router,
    private formBuilder: FormBuilder) {
      this.loginForm = this.formBuilder.group({username: ['', Validators.required],
      password: ['', Validators.required]});
      }

  onLogin(){
    if(this.loginForm.valid){
      this.authService.login(this.loginForm.value).subscribe({
        next: (response: any) => {
          localStorage.setItem('userId', response.userId);
          this.router.navigate(['/matches']);
        },
        error: (error) => {
          alert('Login failed: ' + error.error.message);
        }
      });
    }
  }

  
}
