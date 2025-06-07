import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { RouterService } from '../services/router.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(RouterService);

  if (auth.isLoggedIn()) {
    return true;
  }
  router.switchRoute("");
  return false;
};
