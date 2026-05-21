import { Component, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  showNavbar = false;

  constructor(private router: Router, private authService: AuthService) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateNavbarVisibility();
    });
  }

  protected readonly title = signal('Footryp_Main');

  updateNavbarVisibility() {
    const currentRoute = this.router.url;
    const isAuthPage = currentRoute.includes('login') || currentRoute.includes('register') || currentRoute === '/';
    const hasUserId = !!localStorage.getItem('userId');

    this.showNavbar = hasUserId && !isAuthPage;
  }


  get canShowNavbar(): boolean {
    return this.showNavbar;
  }

  logout() {
    this.authService.logout();
    this.showNavbar = false;
    this.router.navigate(['/login']);
  }
}