import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./users/components/users/users.component').then((component) => component.UsersComponent)
  }
];
