import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { SocketService } from '../../core/services/socket.service';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ai-chat.html',
  styleUrl: './ai-chat.scss'
})
export class AiChatComponent implements OnInit, OnDestroy {
  private socketService = inject(SocketService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  
  textInput = '';
  isRecording = false;
  isConnected = false;
  greetingMessage = '';
  conversationId = '';
  errorMessage = '';
  
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;
  private messageQueue: Float32Array[] = [];
  private queueProcessing = false;
  private subscriptions: Subscription[] = [];

  ngOnInit() {
    console.log('🚀 AI Chat Component Initialized');
    
    // Check if user is authenticated
    const token = this.authService.getToken();
    console.log('🔐 Token exists:', !!token);
    console.log('🔐 Is authenticated:', this.authService.isAuthenticated());
    
    if (!this.authService.isAuthenticated()) {
      console.error('❌ Not authenticated, redirecting to login');
      this.errorMessage = 'Please login first to use AI Voice Chat';
      this.router.navigate(['/login']);
      return;
    }

    console.log('✅ User authenticated, connecting to socket...');
    
    // Connect to socket
    this.socketService.connect();
    
    // Listen for connection status
    const connectionSub = this.socketService.getConnectionStatus().subscribe(
      status => {
        console.log('📡 Connection status changed:', status);
        this.isConnected = status;
        console.log('📡 isConnected variable set to:', this.isConnected);
        console.log('🔄 Triggering change detection...');
        this.cdr.detectChanges();
        console.log('✅ Change detection triggered');
      }
    );
    this.subscriptions.push(connectionSub);

    // Listen for greeting message
    const greetingSub = this.socketService.on<any>('greeting').subscribe(
      data => {
        console.log('👋 Greeting received:', data);
        this.greetingMessage = data.message;
        this.conversationId = data.conversationId;
        console.log('👋 Greeting message set to:', this.greetingMessage);
        console.log('👋 Conversation ID:', this.conversationId);
        console.log('🔄 Triggering change detection for greeting...');
        this.cdr.detectChanges();
        console.log('✅ Change detection triggered for greeting');
      }
    );
    this.subscriptions.push(greetingSub);

    // Listen for audio stream from AI
    const audioSub = this.socketService.onAudioStream().subscribe(
      audioData => {
        const float32Data = this.base64ToFloat32AudioData(audioData);
        this.messageQueue.push(float32Data);
        
        if (!this.queueProcessing) {
          this.playAudioData();
        }
      }
    );
    this.subscriptions.push(audioSub);

    // Listen for errors
    const errorSub = this.socketService.on<any>('error').subscribe(
      error => {
        console.error('Socket error:', error);
        alert('Error: ' + error.message);
      }
    );
    this.subscriptions.push(errorSub);
  }

  ngOnDestroy() {
    // Stop recording if active
    if (this.isRecording) {
      this.stopRecording();
    }
    
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Disconnect socket
    this.socketService.disconnect();
  }

  /**
   * Send text message to AI and get audio response
   */
  sendTextMessage() {
    if (this.textInput.trim() === '') {
      return;
    }

    console.log('Sending text:', this.textInput);
    this.socketService.sendTextContent(this.textInput);
    this.textInput = '';
  }

  /**
   * Toggle voice recording
   */
  async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  /**
   * Start recording audio from microphone
   */
  private async startRecording() {
    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create audio context with 16kHz sample rate (required by Gemini)
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      this.audioSource = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create audio worklet for processing
      const workletName = 'audio-recorder-worklet';
      const audioWorkletCode = this.getAudioWorkletCode();
      
      const blob = new Blob([audioWorkletCode], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);
      
      await this.audioContext.audioWorklet.addModule(workletUrl);
      
      const recordingWorklet = new AudioWorkletNode(this.audioContext, workletName);
      
      // Handle audio chunks from worklet
      recordingWorklet.port.onmessage = (event) => {
        const arrayBuffer = event.data.data.int16arrayBuffer;
        if (arrayBuffer) {
          const base64String = this.arrayBufferToBase64(arrayBuffer);
          this.socketService.sendRealtimeInput(base64String);
        }
      };
      
      // Connect audio source to worklet
      this.audioSource.connect(recordingWorklet);
      
      this.isRecording = true;
      console.log('Recording started');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone. Please check permissions.');
    }
  }

  /**
   * Stop recording audio
   */
  private stopRecording() {
    // Disconnect audio source
    if (this.audioSource) {
      this.audioSource.disconnect();
      this.audioSource = null;
    }
    
    // Stop all media tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isRecording = false;
    console.log('Recording stopped');
  }

  /**
   * Play audio data from queue
   */
  private async playAudioData() {
    this.queueProcessing = true;
    
    while (this.messageQueue.length > 0) {
      const audioChunks = this.messageQueue.shift()!;
      
      // Create audio context for playback
      const audioCtx = new AudioContext();
      
      // Create audio buffer (1 channel, 24kHz sample rate)
      const audioBuffer = audioCtx.createBuffer(1, audioChunks.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      channelData.set(audioChunks);
      
      // Create source node
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      
      // Play audio
      source.start(0);
      
      // Wait before playing next chunk
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    
    this.queueProcessing = false;
  }

  /**
   * Convert base64 audio data to Float32Array
   */
  private base64ToFloat32AudioData(base64String: string): Float32Array {
    const byteCharacters = atob(base64String);
    const byteArray: number[] = [];
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray.push(byteCharacters.charCodeAt(i));
    }
    
    const audioChunks = new Uint8Array(byteArray);
    
    // Convert Uint8Array (16-bit PCM) to Float32Array
    const length = audioChunks.length / 2;
    const float32AudioData = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      // Combine two bytes into one 16-bit signed integer (little-endian)
      let sample = audioChunks[i * 2] | (audioChunks[i * 2 + 1] << 8);
      
      // Convert from 16-bit PCM to Float32 (range -1 to 1)
      if (sample >= 32768) {
        sample -= 65536;
      }
      float32AudioData[i] = sample / 32768;
    }
    
    return float32AudioData;
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return window.btoa(binary);
  }

  /**
   * Get audio worklet processor code
   */
  private getAudioWorkletCode(): string {
    return `
      registerProcessor('audio-recorder-worklet', class AudioProcessingWorklet extends AudioWorkletProcessor {
        buffer = new Int16Array(2048);
        bufferWriteIndex = 0;

        constructor() {
          super();
        }

        process(inputs) {
          if (inputs[0].length) {
            const channel0 = inputs[0][0];
            this.processChunk(channel0);
          }
          return true;
        }

        sendAndClearBuffer() {
          this.port.postMessage({
            event: 'chunk',
            data: {
              int16arrayBuffer: this.buffer.slice(0, this.bufferWriteIndex).buffer,
            },
          });
          this.bufferWriteIndex = 0;
        }

        processChunk(float32Array) {
          const l = float32Array.length;

          for (let i = 0; i < l; i++) {
            // Convert float32 (-1 to 1) to int16 (-32768 to 32767)
            const int16Value = float32Array[i] * 32768;
            this.buffer[this.bufferWriteIndex++] = int16Value;
            
            if (this.bufferWriteIndex >= this.buffer.length) {
              this.sendAndClearBuffer();
            }
          }

          if (this.bufferWriteIndex >= this.buffer.length) {
            this.sendAndClearBuffer();
          }
        }
      });
    `;
  }
}
