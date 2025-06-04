import { Routes } from '@angular/router';
import { SignInComponent } from './sign-in/sign-in.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { MainComponent } from './main/main.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';
import { DialogUserPictureComponent } from './dialogs/dialog-add-user-picture/dialog-user-picture.component';

export const routes: Routes = [
    { path: '', component: SignInComponent},
    { path: 'sign-up', component: SignUpComponent},
    { path: 'message', component: MainComponent},
    { path: 'reset', component: PasswordResetComponent},
    { path: 'add', component: DialogUserPictureComponent},
];
