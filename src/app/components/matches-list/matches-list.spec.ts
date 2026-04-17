import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchesList } from './matches-list';

describe('MatchesList', () => {
  let component: MatchesList;
  let fixture: ComponentFixture<MatchesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchesList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchesList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
