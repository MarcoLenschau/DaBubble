import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { RouterService } from '../services/router.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(RouterService);

  function isTrue(string: any) {
    if (string == "true") {
      return true;
    } else {
      return false;
    }
  }

  if (isTrue(localStorage.getItem("loggedIn"))) {
    return true;
  }

  router.switchRoute("");
  return false;
};