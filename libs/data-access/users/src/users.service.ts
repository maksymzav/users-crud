import {Inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {User} from './user.interface';
import { Observable } from 'rxjs';
import {API_LINK} from '../../shared';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(@Inject(API_LINK) private readonly apiLink: string,
              private httpClient: HttpClient) {
  }

  getAll() {
    return this.httpClient.get<User[]>(`${this.apiLink}/users`);
  }

  updateUser(updatedUser: Partial<User>): Observable<User>{
    return this.httpClient.put<User>(`${this.apiLink}/users/${updatedUser.id}`, updatedUser);
  }

  updateBulkUsers(updatedUsers: Record<number, User>): Observable<Record<number, User>> {
    return this.httpClient.put<Record<number, User>>(`${this.apiLink}/users/bulk`, updatedUsers);
  }
}
