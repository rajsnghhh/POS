import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RewardsPointListsComponent } from './rewards-point-lists.component';

describe('RewardsPointListsComponent', () => {
  let component: RewardsPointListsComponent;
  let fixture: ComponentFixture<RewardsPointListsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RewardsPointListsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RewardsPointListsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
