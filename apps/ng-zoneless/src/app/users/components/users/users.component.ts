import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, Signal } from '@angular/core';
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
import { catchError, of, Subscription } from 'rxjs';
import { UsersStore } from '../../users.store';
import { EditableCellComponent } from '../editable-cell/editable-cell.component';
import { MatButton } from '@angular/material/button';
import { EditedUsersStore } from '../../edited-users.store';
import { UsersService } from '@data-access/users';

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
    EditedUsersStore,
    UsersStore
  ]
})
export class UsersComponent implements OnInit, OnDestroy {
  protected displayedColumns = ['id', 'name', 'username', 'email', 'actions'];
  private editedUsersStore = inject(EditedUsersStore);
  protected editedUsers = this.editedUsersStore.getEditedUsers();
  protected globalEditInProgress = this.editedUsersStore.getGlobalEditInProgress();
  private usersStore = inject(UsersStore);
  protected data: Signal<User[]> = this.usersStore.usersList;
  private subscription = new Subscription();

  constructor(private usersService: UsersService) {
  }

  ngOnInit() {
    const subscription = this.usersService.getAll().subscribe(users => {
      this.usersStore.setUsersList(users);
    });
    this.subscription.add(subscription);
  }

  async onEdit(user: User) {
    this.editedUsersStore.setEditedUsers([[user.id, this.usersStore.usersMap()[user.id]]]);
  }

  onSave(userId: number) {
    this.usersService.updateUser(this.editedUsers().get(userId) as User).subscribe((user) => {
        this.usersStore.updateUser(user);
        this.editedUsersStore.reset();
      }
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  async editAll() {
    this.editedUsersStore.setEditedUsers(this.usersStore.usersList().map(user => [user.id, user]));
    this.editedUsersStore.setGlobalUserEditInProgress(true);
  }

  saveAll() {
    const editedUsers = this.editedUsersStore.getEditedUsers();
    return this.usersService.updateBulkUsers(Object.fromEntries(editedUsers())).pipe(
      catchError(() => {
        console.error('The API to update multiple users is not implemented, the response is simulated');
        return of(Object.fromEntries(editedUsers()));
      })).subscribe((users) => {
      this.usersStore.setUsersList(Object.values(users));
      this.editedUsersStore.reset();
    });
  }
}
