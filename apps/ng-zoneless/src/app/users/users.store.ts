import { User } from './types/user.interface';
import { patchState, signalStore, withComputed, withMethods } from '@ngrx/signals';
import { setEntities, updateEntity, withEntities } from '@ngrx/signals/entities';


export const UsersStore = signalStore(
  withEntities<User>(),
  withMethods((store) => ({
      setUsersList(usersList: User[]) {
        patchState(store, setEntities(usersList));
      },
      updateUser(user: User) {
        patchState(store, updateEntity({ id: user.id, changes: user }));
      }
    })
  ),
  withComputed(({ entityMap, entities }) => ({
    usersList: entities,
    usersMap: entityMap
  }))
);
