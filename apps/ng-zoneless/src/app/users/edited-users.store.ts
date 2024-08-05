import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { User } from './types/user.interface';
import { computed } from '@angular/core';

export const EditedUsersStore = signalStore(
  withState({
    globalEditInProgress: false,
    editedUsers: new Map<number, User>()
  }),
  withMethods((store) => ({
    setEditedUsers(editedUsers: [id: number, user: User][]): void {
      patchState(store, { editedUsers: new Map(editedUsers) });
    },
    setGlobalUserEditInProgress(globalEditInProgress: boolean): void {
      patchState(store, { globalEditInProgress });
    },
    patchEditedUser(update: { id: number, user: Partial<User> }): void {
      const editedUsers = store.editedUsers();
      const user = editedUsers.get(update.id);
      if (user) {
        editedUsers.set(update.id, { ...user, ...update.user });
        patchState(store, { editedUsers });
      }
    },
    reset(){
      patchState(store, { globalEditInProgress: false, editedUsers: new Map() });
    }
  })),
  withComputed(({ editedUsers, globalEditInProgress }) => ({
    getEditedUsers: computed(() => editedUsers),
    getGlobalEditInProgress: computed(() => globalEditInProgress)
  }))
);
