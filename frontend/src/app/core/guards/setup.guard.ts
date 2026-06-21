import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const setupGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isSetupComplete()) {
    return true;
  }

  // Redirect to setup wizard if setup not complete
  return router.createUrlTree(['/setup-wizard']);
};
