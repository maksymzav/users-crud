import { inject, Injectable } from '@angular/core';
import { ComponentStore, OnStoreInit } from '@ngrx/component-store';
import { User } from './types/user.interface';
import { EMPTY, exhaustMap, Observable, Subscription, tap, withLatestFrom } from 'rxjs';
import { createEntityAdapter, EntityAdapter, EntityState, Update } from '@ngrx/entity';
import { UsersService } from '@data-access/users';

export type UsersList = EntityState<User>

export interface UsersState {
  editedUser: Map<number, User>;
  users: UsersList,
}

const adapter: EntityAdapter<User> = createEntityAdapter();
const selectors = adapter.getSelectors();

const initialState: UsersState = {
  editedUser: new Map(),
  users: adapter.getInitialState()
};

@Injectable()
export class UsersStore extends ComponentStore<UsersState> implements OnStoreInit {

  private usersService = inject(UsersService);
  usersList$: Observable<User[]> = this.getUsersListSelector();
  editedUser$: Observable<Map<number, User>> = this.getEditedUserSelector();
  setUsersList: (usersList: User[]) => Subscription = this.getUsersListUpdater();
  enableEditModeOn: ({ id, user }: {
    id: number,
    user: User
  }) => Subscription = this.getEditModeEnabledUserUpdater();
  disableEditModeOn: (id: number) => Subscription = this.getEditModeDisabledUserUpdater();
  patchEditedUser: (update: {id: number, user: Partial<User>}) => Subscription = this.getEditedUserUpdater();
  fetchUsersList = this.getFetchAllUsersEffect();
  updateUser = this.getUpdateUserEffect();

  constructor() {
    super(initialState);
  }

  ngrxOnStoreInit(): void {
    this.fetchUsersList();
  }


  private getUsersListSelector() {
    return this.select<User[]>((state) => selectors.selectAll(state.users));
  }

  private getEditedUserSelector() {
    return this.select<Map<number, User>>(({ editedUser }) => editedUser);
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

  private getEditModeEnabledUserUpdater() {
    return this.updater<{ id: number, user: User }>((state: UsersState, { id, user }) => {
      state.editedUser.set(id, user);
      return {
        ...state,
        editedUser: new Map(state.editedUser),
      };
    });
  }

  private getEditModeDisabledUserUpdater() {
    return this.updater<number>((state: UsersState, id) => {
      state.editedUser.delete(id);
      return state;
    });
  }

  private getEditedUserUpdater() {
    return this.updater<{ id: number, user: Partial<User> }>((state: UsersState, { id, user }) => {
      state.editedUser.set(id, {
        ...state.editedUser.get(id) as User,
        ...user
      });
      return state;
    });
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
            const user = state.editedUser.get(userId);
            if (!user) {
              return EMPTY;
            }
            return this.usersService.updateUser(user).pipe(
              tap({
                next: (user) => {
                  const update: Update<User> = { id: user.id, changes: user };
                  const updateEntityState = this.getUsersEntityStateUpdater();
                  updateEntityState(adapter.updateOne(update, state.users));
                  this.disableEditModeOn(userId);
                }
              }));
          }
        )
      ));
  }


}
