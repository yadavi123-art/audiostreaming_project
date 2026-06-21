import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;

        // Handle specific error codes
        switch (error.status) {
          case 401:
            // Unauthorized - logout and redirect to login
            authService.logout();
            break;
          case 403:
            // Forbidden
            router.navigate(['/forbidden']);
            break;
          case 404:
            // Not found
            console.error('Resource not found:', error.url);
            break;
          case 500:
            // Internal server error
            console.error('Server error:', errorMessage);
            break;
        }
      }

      console.error('HTTP Error:', errorMessage);
      return throwError(() => new Error(errorMessage));
    })
  );
};
