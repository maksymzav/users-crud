import { inject, Injectable } from '@angular/core';
import {ComponentStore, OnStoreInit} from '@ngrx/component-store';
import {User} from './types/user.interface';
import {exhaustMap, Observable, Subscription, tap, withLatestFrom} from 'rxjs';
import {createEntityAdapter, EntityAdapter, EntityState, Update} from '@ngrx/entity';
import {UsersService} from '@data-access/users';

export type UsersList = EntityState<User>

export interface UsersState {
  editedUser: User | null;
  users: UsersList,
}

const adapter: EntityAdapter<User> = createEntityAdapter();
const selectors = adapter.getSelectors();

const initialState: UsersState = {
  editedUser: null,
  users: adapter.getInitialState(),
};

@Injectable()
export class UsersStore extends ComponentStore<UsersState> implements OnStoreInit {
  private usersService = inject(UsersService);
  usersList$: Observable<User[]> = this.getUsersListSelector();
  editedUser$: Observable<User | null> = this.getEditedUserSelector();

  setUsersList: (usersList: User[]) => Subscription = this.getUsersListUpdater();
  enableEditModeOn: (user: User | null) => Subscription = this.getEditModeEnabledUserUpdater();
  patchEditedUser: (update: Partial<User>) => Subscription = this.getEditedUserUpdater();

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
    return this.select<User | null>(({editedUser}) => editedUser);
  }

  private getUsersListUpdater() {
    return this.updater<User[]>((state: UsersState, usersList: User[]) => {
        return {
          ...state,
          users: adapter.setAll(usersList, state.users),
        };
      }
    );
  }

  private getUsersEntityStateUpdater() {
    return this.updater<UsersList>((state: UsersState, usersListEntity: UsersList) => {
        return {
          ...state,
          users: usersListEntity,
        };
      }
    );
  }

  private getEditModeEnabledUserUpdater() {
    return this.updater<User | null>((state: UsersState, editedUser: User | null) => ({
      ...state,
      editedUser,
    }));
  }

  private getEditedUserUpdater() {
    return this.updater<Partial<User>>((state: UsersState, userPatch) => ({
      ...state,
      editedUser: Object.assign({...state.editedUser, ...userPatch}),
    }));
  }

  private getFetchAllUsersEffect() {
    return this.effect(() => this.usersService.getAll().pipe(
      tap((users: User[]) => {
        this.setUsersList(users);
      }),
    ));
  }

  private getUpdateUserEffect() {
    return this.effect<void>(
      (trigger$) => trigger$.pipe(
        withLatestFrom(this.state$),
        exhaustMap(([, state]) => this.usersService.updateUser(state.editedUser as User).pipe(
          tap({
            next: (user) => {
              const update: Update<User> = {id: user.id, changes: user};
              const updateEntityState = this.getUsersEntityStateUpdater();
              updateEntityState(adapter.updateOne(update, state.users));
              this.enableEditModeOn(null);
            }
          })),
        )
      ));
  }


}
