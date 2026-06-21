import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class SettingsComponent {
  // Profile Settings
  profile = {
    name: 'User',
    email: 'user@example.com',
    class: 'Not set',
    bio: 'Learning enthusiast'
  };

  // Notification Settings
  notifications = {
    emailNotifications: true,
    pushNotifications: false,
    discussionUpdates: true,
    progressReminders: true,
    weeklyReport: true
  };

  // Learning Preferences
  preferences = {
    autoplay: false,
    playbackSpeed: '1.0',
    theme: 'light',
    language: 'en'
  };

  // Privacy Settings
  privacy = {
    profileVisibility: 'public',
    showProgress: true,
    allowMessages: true
  };

  saveSettings() {
    alert('Settings saved successfully!');
  }

  resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      this.notifications = {
        emailNotifications: true,
        pushNotifications: false,
        discussionUpdates: true,
        progressReminders: true,
        weeklyReport: true
      };
      this.preferences = {
        autoplay: false,
        playbackSpeed: '1.0',
        theme: 'light',
        language: 'en'
      };
      alert('Settings reset to default!');
    }
  }
}
