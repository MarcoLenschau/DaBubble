import { Component, EventEmitter, Output } from '@angular/core';
import { InputComponent } from '../../shared/input/input.component';
import { RouterService } from '../../core/services/router.service';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [InputComponent, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  @Output() dataReady = new EventEmitter<boolean>();
  @Output() userData = new EventEmitter<any>();
  user = {
    displayName: '',
    email: '',
    password: ''
  };

  constructor(public router: RouterService, private auth: AuthService) { }

  acceptPrivacy() {
    document.getElementById("checkbox")?.classList.toggle("checked");
  }

  registerUser() {
    this.sendData();
  }

  setValue(eventValue: string, type: string) {
    if (type === 'email') {
      this.user.email = eventValue;
    } else if (type === 'password') {
      this.user.password = eventValue;
    } else if (type === 'name') {
      this.user.displayName = eventValue;
    }
  }

  sendData() {
    this.dataReady.emit(true);
    this.userData.emit(this.user);
  }
}
