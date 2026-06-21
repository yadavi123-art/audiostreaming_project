import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-audio-learning',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './audio-learning.html',
  styleUrl: './audio-learning.scss'
})
export class AudioLearningComponent {
  topics = [
    {
      id: 1,
      title: 'Introduction to Programming',
      duration: '45 min',
      description: 'Learn the basics of programming concepts',
      progress: 75,
      isPlaying: false
    },
    {
      id: 2,
      title: 'Data Structures Fundamentals',
      duration: '60 min',
      description: 'Understanding arrays, lists, and trees',
      progress: 30,
      isPlaying: false
    },
    {
      id: 3,
      title: 'Web Development Basics',
      duration: '50 min',
      description: 'HTML, CSS, and JavaScript essentials',
      progress: 0,
      isPlaying: false
    },
    {
      id: 4,
      title: 'Database Design',
      duration: '55 min',
      description: 'SQL and database modeling principles',
      progress: 100,
      isPlaying: false
    }
  ];

  currentlyPlaying: number | null = null;

  togglePlay(topicId: number) {
    if (this.currentlyPlaying === topicId) {
      this.currentlyPlaying = null;
      this.topics.find(t => t.id === topicId)!.isPlaying = false;
    } else {
      // Stop any currently playing
      if (this.currentlyPlaying) {
        this.topics.find(t => t.id === this.currentlyPlaying)!.isPlaying = false;
      }
      this.currentlyPlaying = topicId;
      this.topics.find(t => t.id === topicId)!.isPlaying = true;
    }
  }

  getStatusText(progress: number): string {
    if (progress === 0) return 'Not Started';
    if (progress === 100) return 'Completed';
    return 'In Progress';
  }

  getStatusClass(progress: number): string {
    if (progress === 0) return 'status-not-started';
    if (progress === 100) return 'status-completed';
    return 'status-in-progress';
  }
}
