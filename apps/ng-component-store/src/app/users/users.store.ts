import { inject, Injectable } from '@angular/core';
import { ComponentStore, OnStoreInit } from '@ngrx/component-store';
import { User } from './types/user.interface';
import { catchError, EMPTY, exhaustMap, Observable, of, Subscription, tap, withLatestFrom } from 'rxjs';
import { createEntityAdapter, EntityAdapter, EntityState, Update } from '@ngrx/entity';
import { UsersService } from '@data-access/users';

export type UsersList = EntityState<User>

export interface UsersState {
  globalEditInProgress: boolean,
  editedUser: Map<number, User>;
  users: UsersList,
}

const adapter: EntityAdapter<User> = createEntityAdapter();
const selectors = adapter.getSelectors();

const initialState: UsersState = {
  globalEditInProgress: false,
  editedUser: new Map(),
  users: adapter.getInitialState()
};

@Injectable()
export class UsersStore extends ComponentStore<UsersState> implements OnStoreInit {
  usersList$: Observable<User[]>;
  editedUser$: Observable<Map<number, User>>;
  globalEditInProgress$: Observable<boolean>;

  setUsersList: (usersList: User[]) => Subscription;
  enableEditModeOn: ({ id, user }: { id: number, user: User }) => Subscription;
  disableEditModeOn: (id: number) => Subscription;
  patchEditedUser: (update: { id: number, user: Partial<User> }) => Subscription;
  setGlobalUserEditInProgress: (globalEditInProgress: boolean) => Subscription;

  setEditedUsers: (userIds: number[]) => void;
  fetchUsersList: () => Subscription;
  updateUser: (userId: number) => Subscription;
  updateAllEditedUsers: () => Subscription;

  private usersService: UsersService;

  constructor() {
    super(initialState);
    this.usersService = inject(UsersService);

    this.usersList$ = this.getUsersListSelector();
    this.editedUser$ = this.getEditedUserSelector();
    this.globalEditInProgress$ = this.getIsGlobalEditInProgressSelector();

    this.setUsersList = this.getUsersListUpdater();
    this.enableEditModeOn = this.getEditModeEnabledUserUpdater();
    this.disableEditModeOn = this.getEditModeDisabledUserUpdater();
    this.patchEditedUser = this.getEditedUserUpdater();
    this.setGlobalUserEditInProgress = this.getGlobalEditInProgressUpdater();

    this.setEditedUsers = this.getEditBulkUsersUpdater();
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

  private getEditedUserSelector() {
    return this.select<Map<number, User>>(({ editedUser }) => editedUser);
  }

  private getIsGlobalEditInProgressSelector() {
    return this.select<boolean>(({ globalEditInProgress }) => globalEditInProgress);
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
        editedUser: new Map(state.editedUser)
      };
    });
  }

  private getBulkUsersMap(state: UsersState, userIds: number[]) {
    return userIds.reduce((acc, id) => {
      acc.set(id, state.users.entities[id]);
      return acc;
    }, new Map());
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

  private getEditBulkUsersUpdater() {
    return this.updater<number[]>((state: UsersState, userIds: number[]) => ({
      ...state,
      editedUser: this.getBulkUsersMap(state, userIds),
      globalEditInProgress: true
    }));
  }

  private getGlobalEditInProgressUpdater() {
    return this.updater<boolean>((state: UsersState, globalEditInProgress) => ({
      ...state,
      globalEditInProgress
    }));
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

  private getUpdateBulkUsersEffect() {
    return this.effect<void>(
      (trigger$) => trigger$.pipe(
        withLatestFrom(this.state$),
        exhaustMap(([, state]) => {
            return this.usersService.updateBulkUsers(Object.fromEntries(state.editedUser)).pipe(
              catchError(() => {
                console.error('The API to update multiple users is not implemented, the response is simulated');
                return of(Object.fromEntries(state.editedUser));
              }),
              tap({
                next: (usersMap) => {
                  const updates: Update<User>[] = Object.entries(usersMap).reduce<Update<User>[]>((acc, [userId, user]) => {
                    acc.push({ id: +userId, changes: user });
                    return acc;
                  }, []);
                  const updateEntityState = this.getUsersEntityStateUpdater();
                  updateEntityState(adapter.updateMany(updates, state.users));
                  this.setEditedUsers([]);
                  this.setGlobalUserEditInProgress(false);
                }
              }));
          }
        )
      ));
  }


}
