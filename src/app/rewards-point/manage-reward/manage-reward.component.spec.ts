import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageRewardComponent } from './manage-reward.component';

describe('ManageRewardComponent', () => {
  let component: ManageRewardComponent;
  let fixture: ComponentFixture<ManageRewardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageRewardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageRewardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
