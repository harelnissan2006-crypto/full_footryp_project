import { Component, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(private router: Router) {}
  protected readonly title = signal('Footryp_Main');

  isLoggedIn(): boolean {
    return !!localStorage.getItem('userId');
  }
  logout(){
    localStorage.removeItem('userId');
    this.router.navigate(['/login']);
  }
}
