import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private authService = inject(AuthService);
  private socket: Socket | null = null;
  private connectionStatus$ = new Subject<boolean>();

  /**
   * Connect to Socket.io server
   */
  connect(): void {
    console.log('🔌 SocketService.connect() called');
    
    if (this.socket?.connected) {
      console.log('⚠️ Socket already connected, skipping');
      this.connectionStatus$.next(true);
      return;
    }

    const token = this.authService.getToken();
    const socketUrl = environment.socketUrl || window.location.origin;
    
    console.log('🔑 Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    console.log('🌐 Socket URL:', socketUrl);
    
    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    console.log('📡 Socket instance created');

    this.socket.on('connect', () => {
      console.log('✅ Socket connected! ID:', this.socket?.id);
      console.log('📤 Emitting connection status: true');
      this.connectionStatus$.next(true);
      console.log('✅ Connection status emitted');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected. Reason:', reason);
      this.connectionStatus$.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.connectionStatus$.next(false);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
    
    console.log('🎧 All socket event listeners registered');
  }

  /**
   * Disconnect from Socket.io server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus$.next(false);
      console.log('Socket disconnected');
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get connection status as observable
   */
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus$.asObservable();
  }

  /**
   * Emit event to server
   */
  emit(event: string, data?: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Cannot emit event:', event);
    }
  }

  /**
   * Listen to event from server
   */
  on<T>(event: string): Observable<T> {
    return new Observable(observer => {
      if (!this.socket) {
        console.warn('Socket not initialized');
        observer.error('Socket not initialized');
        return;
      }

      const handler = (data: T) => {
        observer.next(data);
      };

      this.socket.on(event, handler);

      // Cleanup function
      return () => {
        if (this.socket) {
          this.socket.off(event, handler);
        }
      };
    });
  }

  /**
   * Listen to event once
   */
  once<T>(event: string): Observable<T> {
    return new Observable(observer => {
      if (!this.socket) {
        console.warn('Socket not initialized');
        observer.error('Socket not initialized');
        return;
      }

      this.socket.once(event, (data: T) => {
        observer.next(data);
        observer.complete();
      });
    });
  }

  /**
   * Remove listener for event
   */
  off(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  /**
   * Send text content for audio generation
   */
  sendTextContent(text: string): void {
    this.emit('contentUpdateText', text);
  }

  /**
   * Send realtime audio input
   */
  sendRealtimeInput(audioData: string): void {
    this.emit('realtimeInput', audioData);
  }

  /**
   * Listen for audio stream
   */
  onAudioStream(): Observable<string> {
    return this.on<string>('audioStream');
  }

  /**
   * Listen for greeting message
   */
  onGreeting(): Observable<any> {
    return this.on<any>('greeting');
  }

  /**
   * Archive current conversation
   */
  archiveConversation(): void {
    this.emit('archiveConversation');
  }

  /**
   * Listen for conversation archived event
   */
  onConversationArchived(): Observable<any> {
    return this.on<any>('conversationArchived');
  }

  /**
   * Send discussion update
   */
  sendDiscussionUpdate(discussionId: string, action: string): void {
    this.emit('discussionUpdate', { discussionId, action });
  }

  /**
   * Listen for discussion updates
   */
  onDiscussionUpdate(discussionId: string): Observable<any> {
    return this.on<any>(`discussion:${discussionId}`);
  }
}
