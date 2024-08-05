import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
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
import { BehaviorSubject, catchError, map, Observable, of, Subscription } from 'rxjs';
import { MatButton } from '@angular/material/button';
import { UsersService } from '@data-access/users';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

const editableColumns: Record<keyof User, boolean> = {
  id: false,
  name: true,
  username: true,
  email: true
};

type EditedUser = {
  user: User;
  form: FormGroup<{
    id: FormControl<number | null>;
    name: FormControl<string | null>;
    username: FormControl<string | null>;
    email: FormControl<string | null>;
  }>;
};


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
    MatButton,
    MatFormField,
    MatInput,
    ReactiveFormsModule
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent implements OnDestroy, OnInit {
  protected data$ = new BehaviorSubject<Map<number, User>>(new Map());
  protected dataSource$: Observable<User[]> = this.data$.pipe(map(users => Array.from(users.values())));
  protected displayedColumns = ['id', 'name', 'username', 'email', 'actions'];
  protected editedUser = new Map<number, EditedUser>();
  protected globalEditInProgress: boolean = false;
  protected editableColumns = editableColumns;
  private subscription = new Subscription();

  constructor(private usersService: UsersService, private formBuilder: FormBuilder) {
  }

  ngOnInit() {
    const subscription = this.usersService.getAll().pipe(
      map(users => users.reduce((acc, user) => {
        acc.set(user.id, user);
        return acc;
      }, new Map()))
    ).subscribe((users) => {
      this.data$.next(users);
    });
    this.subscription.add(subscription);
  }

  onEdit(user: User) {
    this.editedUser = new Map([[user.id, { user, form: this.formBuilder.group(user) }]]);
  }

  onSave(userId: number) {
    const editedUser = this.editedUser.get(userId);
    if (editedUser) {
      const subscription = this.usersService.updateUser({ id: userId, ...editedUser.form.value as Partial<User> }).subscribe(() => {
        this.editedUser.delete(userId);
        const usersMap = this.data$.value;
        usersMap.set(userId, { ...this.data$.value.get(userId), ...editedUser.form.value as User });
        this.data$.next(usersMap);
      });
      this.subscription.add(subscription);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  async editAll() {
    this.editedUser = new Map(Array.from(this.data$.value).map(([userId, user]) => [userId, {
      user,
      form: this.formBuilder.group(user)
    }]));
    this.globalEditInProgress = true;
  }

  saveAll() {
    const users = Array.from(this.editedUser.entries()).reduce((acc, [userId, editedUser]) => {
      acc[userId] = {...editedUser.user, ...editedUser.form.value} as User;
      return acc;
    }, {} as Record<number, User>);
    this.usersService.updateBulkUsers(users).pipe(
      catchError(() => {
        console.error('The API to update multiple users is not implemented, the response is simulated');
        return of(users);
      }),
    ).subscribe((usersMap) => {
      const updatedUsers = Object.entries(usersMap).reduce((acc, [userId, user]) => {
        acc.set(+userId, user);
        return acc;
      }, new Map<number, User>());
      this.data$.next(updatedUsers);
      this.editedUser.clear();
      this.globalEditInProgress = false;
    });
  }
}
