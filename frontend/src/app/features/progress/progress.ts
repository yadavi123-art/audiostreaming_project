import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './progress.html',
  styleUrl: './progress.scss'
})
export class ProgressComponent {
  overallProgress = 68;
  
  stats = {
    totalHours: 42,
    completedTopics: 12,
    totalTopics: 18,
    currentStreak: 7
  };

  recentActivity = [
    {
      title: 'Completed: Database Design',
      date: new Date(Date.now() - 1000 * 60 * 60 * 2),
      type: 'completion',
      icon: '✅'
    },
    {
      title: 'Started: Web Development Basics',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24),
      type: 'start',
      icon: '▶️'
    },
    {
      title: 'Participated in Discussion',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      type: 'discussion',
      icon: '💬'
    },
    {
      title: 'Completed: Data Structures Quiz',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      type: 'completion',
      icon: '✅'
    }
  ];

  weeklyProgress = [
    { day: 'Mon', hours: 2.5 },
    { day: 'Tue', hours: 3 },
    { day: 'Wed', hours: 1.5 },
    { day: 'Thu', hours: 4 },
    { day: 'Fri', hours: 2 },
    { day: 'Sat', hours: 3.5 },
    { day: 'Sun', hours: 2.5 }
  ];

  topicProgress = [
    { name: 'Programming Basics', progress: 100 },
    { name: 'Data Structures', progress: 75 },
    { name: 'Web Development', progress: 50 },
    { name: 'Database Design', progress: 100 },
    { name: 'Algorithms', progress: 30 },
    { name: 'System Design', progress: 0 }
  ];

  getMaxHours(): number {
    return Math.max(...this.weeklyProgress.map(d => d.hours));
  }

  getBarHeight(hours: number): number {
    const max = this.getMaxHours();
    return (hours / max) * 100;
  }

  getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }
}
