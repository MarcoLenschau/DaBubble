import { Component, inject, ViewChild } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { InputComponent } from "../../shared/input/input.component";
import { ButtonComponent } from "../../shared/button/button.component";
import { EmailAuthProvider, reauthenticateWithCredential } from '@angular/fire/auth';

@Component({
  selector: 'app-dialog-email-edit',
  imports: [InputComponent, ButtonComponent],
  templateUrl: './dialog-email-edit.component.html',
  styleUrl: './dialog-email-edit.component.scss'
})
export class DialogEmailEditComponent {
  @ViewChild('email') email!: any;
  private auth = inject(AuthService);
  newEmail = "";
  password = "";

  editEmail() {
    const credential = EmailAuthProvider.credential(this.auth.user.email!, this.password);
    reauthenticateWithCredential(this.auth.user, credential)
    .then(() => this.auth.editEmail(this.newEmail));
  }

  validate(event: any) {
    this.auth.validateEmail(event) ? this.auth.validateError(this.email, "remove") : this.auth.validateError(this.email);
  }

  setValue(eventValue: string, type: string){
    if (type === "email") {
      this.newEmail = eventValue;
    } else {
      this.password = eventValue;
    }
  }
}
