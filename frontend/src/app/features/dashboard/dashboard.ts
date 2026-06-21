import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {
  user = {
    name: 'User',
    email: 'user@example.com',
    class: 'Not set',
    setupComplete: false
  };

  logout() {
    // Navigate to login
    window.location.href = '/login';
  }
}
