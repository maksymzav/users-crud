import { ChangeDetectionStrategy, Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { User } from '../../types/user.interface';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { UsersStore } from '../../users.store';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Subscription } from 'rxjs';

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
export class EditableCellComponent implements OnDestroy, OnInit {
  @Input({ required: true }) user!: User;
  @Input({ required: true }) columnName!: keyof User;
  editableColumns = editableColumns;
  subscription = new Subscription();
  initial = true;
  protected editedUser$ = new BehaviorSubject<User | undefined>(undefined);
  private usersStore: UsersStore = inject(UsersStore);

  ngOnInit() {
    this.usersStore.editedUser$.subscribe((editedUserMap) => {
      if (editedUserMap.get(this.user.id) !== this.editedUser$.value) {
        this.editedUser$.next(editedUserMap.get(this.user.id));
      }
    });
  }

  updateValue(value: string) {
    const subscription = this.usersStore.patchEditedUser({ id: this.user.id, user: { [this.columnName]: value } });
    this.subscription.add(subscription);
  }


  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
