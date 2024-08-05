import { inject, Injectable } from '@angular/core';
import { ComponentStore, OnStoreInit } from '@ngrx/component-store';
import { User } from './types/user.interface';
import { catchError, EMPTY, exhaustMap, Observable, of, Subscription, tap, withLatestFrom } from 'rxjs';
import { createEntityAdapter, EntityAdapter, EntityState, Update } from '@ngrx/entity';
import { UsersService } from '@data-access/users';
import { EditedUsersStore } from './edited-users.store';

export type UsersList = EntityState<User>

export interface UsersState {
  users: UsersList,
}

const adapter: EntityAdapter<User> = createEntityAdapter();
const selectors = adapter.getSelectors();

const initialState: UsersState = {
  users: adapter.getInitialState()
};

@Injectable()
export class UsersStore extends ComponentStore<UsersState> implements OnStoreInit {
  usersList$: Observable<User[]>;

  setUsersList: (usersList: User[]) => Subscription;

  fetchUsersList: () => Subscription;
  updateUser: (userId: number) => Subscription;
  updateAllEditedUsers: () => Subscription;

  private usersService: UsersService;
  private editedUsersStore = inject(EditedUsersStore);

  constructor() {
    super(initialState);
    this.usersService = inject(UsersService);

    this.usersList$ = this.getUsersListSelector();

    this.setUsersList = this.getUsersListUpdater();

    this.fetchUsersList = this.getFetchAllUsersEffect();
    this.updateUser = this.getUpdateUserEffect();
    this.updateAllEditedUsers = this.getUpdateBulkUsersEffect();
  }

  ngrxOnStoreInit(): void {
    this.fetchUsersList();
  }


  private getUsersListSelector() {
    return this.select<User[]>((state) => selectors.selectAll(state.users));
  }

  private getUsersListUpdater() {
    return this.updater<User[]>((state: UsersState, usersList: User[]) => {
        return {
          ...state,
          users: adapter.setAll(usersList, state.users)
        };
      }
    );
  }

  private getUsersEntityStateUpdater() {
    return this.updater<UsersList>((state: UsersState, usersListEntity: UsersList) => {
        return {
          ...state,
          users: usersListEntity
        };
      }
    );
  }

  private getFetchAllUsersEffect() {
    return this.effect(() => this.usersService.getAll().pipe(
      tap((users: User[]) => {
        this.setUsersList(users);
      })
    ));
  }


  private getUpdateUserEffect() {
    return this.effect<number>(
      (trigger$) => trigger$.pipe(
        withLatestFrom(this.state$),
        exhaustMap(([userId, state]) => {
            const editedUsers = this.editedUsersStore.getEditedUsers();
            const user = editedUsers().get(userId);
            if (!user) {
              return EMPTY;
            }
            return this.usersService.updateUser(user).pipe(
              tap({
                next: (user) => {
                  const update: Update<User> = { id: user.id, changes: user };
                  const updateEntityState = this.getUsersEntityStateUpdater();
                  updateEntityState(adapter.updateOne(update, state.users));
                  this.editedUsersStore.reset();
                }
              }));
          }
        )
      ));
  }

  private getUpdateBulkUsersEffect() {
    return this.effect<void>(
      (trigger$) => trigger$.pipe(
        withLatestFrom(this.state$),
        exhaustMap(([, state]) => {
            const editedUsers = this.editedUsersStore.getEditedUsers();
            return this.usersService.updateBulkUsers(Object.fromEntries(editedUsers())).pipe(
              catchError(() => {
                console.error('The API to update multiple users is not implemented, the response is simulated');
                return of(Object.fromEntries(editedUsers()));
              }),
              tap({
                next: (usersMap) => {

                  const updates: Update<User>[] = Array.from(editedUsers()).reduce<Update<User>[]>((acc, [userId, user]) => {
                    acc.push({ id: +userId, changes: user });
                    return acc;
                  }, []);
                  const updateEntityState = this.getUsersEntityStateUpdater();
                  updateEntityState(adapter.updateMany(updates, state.users));
                  this.editedUsersStore.reset();
                }
              }));
          }
        )
      ));
  }


}
