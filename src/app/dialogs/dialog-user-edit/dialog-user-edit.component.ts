import { Component, Input } from '@angular/core';
import { InputComponent } from '../../input/input.component';
import { ButtonComponent } from '../../button/button.component';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-user-edit',
  imports: [InputComponent, ButtonComponent],
  standalone: true,
  templateUrl: './dialog-user-edit.component.html',
  styleUrl: './dialog-user-edit.component.scss'
})
export class DialogUserEditComponent {
  @Input() user: any = {};

  constructor(private dialogRef: MatDialogRef<DialogUserEditComponent>) {}

  dialogClose() {
    this.dialogRef.close();
  }

  userSave() {}
}
