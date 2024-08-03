import {ChangeDetectionStrategy, Component, Input, OnDestroy} from '@angular/core';
import {User} from '../../types/user.interface';
import {MatFormField} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {UsersStore} from '../../users.store';
import {AsyncPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

const editableColumns: Record<keyof User, boolean> = {
  id: false,
  name: true,
  username: true,
  email: true,
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
  @Input({required: true}) user!: User;
  @Input({required: true}) columnName!: keyof User;
  editableColumns = editableColumns;
  subscription = new Subscription();

  protected editedUser$;

  constructor(private usersStore: UsersStore) {
    this.editedUser$ = this.usersStore.editedUser$;
  }

  updateValue(value: string) {
    const subscription = this.usersStore.patchEditedUser({[this.columnName]: value});
    this.subscription.add(subscription);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
