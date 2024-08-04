import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable
} from '@angular/material/table';
import { User } from '../../types/user.interface';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { UsersStore } from '../../users.store';
import { EditableCellComponent } from '../editable-cell/editable-cell.component';
import { MatButton } from '@angular/material/button';
import { provideComponentStore } from '@ngrx/component-store';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    MatTable,
    MatHeaderRow,
    MatHeaderRowDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatCell,
    MatCellDef,
    MatRow,
    MatRowDef,
    AsyncPipe,
    NgTemplateOutlet,
    EditableCellComponent,
    MatButton
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideComponentStore(UsersStore)
  ]
})
export class UsersComponent implements OnDestroy {
  protected data$: Observable<User[]>;
  protected displayedColumns = ['id', 'name', 'username', 'email', 'actions'];
  protected editedUser$: Observable<Map<number, User | null>>;
  protected globalEditInProgress$: Observable<boolean>;
  private subscription = new Subscription();

  constructor(private usersStore: UsersStore) {
    this.data$ = this.usersStore.usersList$;
    this.editedUser$ = this.usersStore.editedUser$;
    this.globalEditInProgress$ = this.usersStore.globalEditInProgress$;
  }

  onEdit(user: User) {
    this.usersStore.setEditedUsers( [user.id]);
  }

  onSave(userId: number) {
    const subscription = this.usersStore.updateUser(userId);
    this.subscription.add(subscription);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  async editAll() {
    const users = await firstValueFrom(this.data$);
    this.usersStore.setEditedUsers(users.map(user => user.id));
  }

  saveAll() {
    this.usersStore.updateAllEditedUsers();
  }
}
