import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { DashboardComponent } from './features/dashboard/dashboard';
import { AudioLearningComponent } from './features/audio-learning/audio-learning';
import { DiscussionsComponent } from './features/discussions/discussions';
import { ProgressComponent } from './features/progress/progress';
import { SettingsComponent } from './features/settings/settings';
import { AiChatComponent } from './features/ai-chat/ai-chat';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'audio-learning', component: AudioLearningComponent, canActivate: [authGuard] },
  { path: 'ai-chat', component: AiChatComponent, canActivate: [authGuard] },
  { path: 'discussions', component: DiscussionsComponent, canActivate: [authGuard] },
  { path: 'progress', component: ProgressComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/login' }
];
