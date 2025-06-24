import { Routes } from '@angular/router';
import { SignInComponent } from './auth/sign-in/sign-in.component';
import { SignUpComponent } from './auth/sign-up/sign-up.component';
import { MainComponent } from './main/main.component';
import { PasswordResetComponent } from './auth/password-reset/password-reset.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', component: SignInComponent},
    { path: 'sign-up', component: SignUpComponent},
    { path: 'message', component: MainComponent, canActivate: [authGuard]},
    { path: 'reset', component: PasswordResetComponent}
];