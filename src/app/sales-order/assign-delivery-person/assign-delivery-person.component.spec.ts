import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignDeliveryPersonComponent } from './assign-delivery-person.component';

describe('AssignDeliveryPersonComponent', () => {
  let component: AssignDeliveryPersonComponent;
  let fixture: ComponentFixture<AssignDeliveryPersonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssignDeliveryPersonComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignDeliveryPersonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
