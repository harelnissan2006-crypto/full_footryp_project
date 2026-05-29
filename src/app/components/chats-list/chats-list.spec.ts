import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatsList } from './chats-list';

describe('ChatsList', () => {
  let component: ChatsList;
  let fixture: ComponentFixture<ChatsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatsList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
