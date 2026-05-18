import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSuggestions } from './user-suggestions';

describe('UserSuggestions', () => {
  let component: UserSuggestions;
  let fixture: ComponentFixture<UserSuggestions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSuggestions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserSuggestions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
