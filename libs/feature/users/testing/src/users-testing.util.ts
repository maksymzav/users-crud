import { ComponentFixture, TestBed, TestModuleMetadata } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_LINK } from '@data-access/shared';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { getRandomInteger } from '@utils';
import { User } from '@data-access/users';
import { Type } from '@angular/core';

const apiLink = 'myApi' + getRandomInteger();

export class UsersTestingUtil<T> {
  static twoUsersList = [
    { id: 0, name: 'api-name1', username: 'api-username1', email: 'api-email1@test.com' },
    { id: 1, name: 'api-name2', username: 'api-username2', email: 'api-email2@test.com' }
  ] satisfies User[];
  component!: T;
  fixture!: ComponentFixture<T>;
  httpMock!: HttpTestingController;

  async compileComponent(component: Type<T>, moduleDef: TestModuleMetadata = {}) {
    await TestBed.configureTestingModule({
      imports: [
        component,
        ...moduleDef.imports ?? []
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_LINK, useValue: apiLink },
        provideNoopAnimations(),
        ...moduleDef.providers ?? []
      ]
    })
      .compileComponents();

    this.fixture = TestBed.createComponent(component);
    this.component = this.fixture.componentInstance;
    this.fixture.detectChanges();

    this.httpMock = TestBed.inject(HttpTestingController);
  }

  async mockUsersCall(data: User[]) {
    const req = this.httpMock.expectOne(`${apiLink}/users`);
    expect(req.request.method).toBe('GET');

    req.flush(data);
    this.httpMock.verify();
  }

  async mockUpdateUserCall(userId: number, flushData: Partial<User> = {}) {
    const req = this.httpMock.expectOne(`${apiLink}/users/${userId}`);
    expect(req.request.method).toBe('PUT');

    req.flush(flushData);
    this.httpMock.verify();
  }

  async mockBulkEditCall(flushData: Record<number, User>) {
    const req = this.httpMock.expectOne(`${apiLink}/users/bulk`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(flushData);

    req.flush(flushData);
    this.httpMock.verify();
  }
}
