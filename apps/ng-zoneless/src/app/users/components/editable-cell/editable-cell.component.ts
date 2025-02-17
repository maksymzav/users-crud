import { ChangeDetectionStrategy, Component, inject, input, OnDestroy } from '@angular/core';
import { User } from '../../types/user.interface';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { EditedUsersStore } from '../../edited-users.store';

const editableColumns: Record<keyof User, boolean> = {
  id: false,
  name: true,
  username: true,
  email: true
};

@Component({
  selector: 'app-editable-cell',
  standalone: true,
  imports: [
    MatFormField,
    MatInput,
    AsyncPipe,
    FormsModule
  ],
  templateUrl: './editable-cell.component.html',
  styleUrl: './editable-cell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditableCellComponent implements OnDestroy {
  user = input.required<User>();
  columnName = input.required<keyof User>();
  protected editableColumns = editableColumns;
  private subscription = new Subscription();
  private editedUsersStore = inject(EditedUsersStore);
  protected editedUsers = this.editedUsersStore.getEditedUsers();

  updateValue(value: string) {
    const subscription = this.editedUsersStore.patchEditedUser({
      id: this.user().id,
      user: { [this.columnName()]: value }
    });
    this.subscription.add(subscription);
  }


  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
