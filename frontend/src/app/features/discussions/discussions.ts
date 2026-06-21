import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Message {
  id: number;
  user: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
}

interface Discussion {
  id: number;
  title: string;
  topic: string;
  messageCount: number;
  lastActivity: Date;
  participants: number;
}

@Component({
  selector: 'app-discussions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './discussions.html',
  styleUrl: './discussions.scss'
})
export class DiscussionsComponent {
  discussions: Discussion[] = [
    {
      id: 1,
      title: 'Best practices for learning programming',
      topic: 'Programming',
      messageCount: 24,
      lastActivity: new Date(Date.now() - 1000 * 60 * 30),
      participants: 8
    },
    {
      id: 2,
      title: 'Understanding data structures',
      topic: 'Data Structures',
      messageCount: 15,
      lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2),
      participants: 5
    },
    {
      id: 3,
      title: 'Web development tips and tricks',
      topic: 'Web Development',
      messageCount: 42,
      lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 5),
      participants: 12
    }
  ];

  selectedDiscussion: Discussion | null = null;
  messages: Message[] = [];
  newMessage = '';

  selectDiscussion(discussion: Discussion) {
    this.selectedDiscussion = discussion;
    // Simulate loading messages
    this.messages = [
      {
        id: 1,
        user: 'Alice',
        text: 'Has anyone tried the new audio learning module?',
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        isOwn: false
      },
      {
        id: 2,
        user: 'You',
        text: 'Yes! It\'s really helpful for learning on the go.',
        timestamp: new Date(Date.now() - 1000 * 60 * 40),
        isOwn: true
      },
      {
        id: 3,
        user: 'Bob',
        text: 'I agree! The progress tracking feature is great too.',
        timestamp: new Date(Date.now() - 1000 * 60 * 35),
        isOwn: false
      },
      {
        id: 4,
        user: 'You',
        text: 'Definitely! It helps me stay motivated.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        isOwn: true
      }
    ];
  }

  sendMessage() {
    if (this.newMessage.trim() && this.selectedDiscussion) {
      this.messages.push({
        id: this.messages.length + 1,
        user: 'You',
        text: this.newMessage,
        timestamp: new Date(),
        isOwn: true
      });
      this.newMessage = '';
    }
  }

  getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  backToList() {
    this.selectedDiscussion = null;
    this.messages = [];
  }
}
