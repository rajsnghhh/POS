import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CounterWiseSalesOrderComponent } from './counter-wise-sales-order.component';

describe('CounterWiseSalesOrderComponent', () => {
  let component: CounterWiseSalesOrderComponent;
  let fixture: ComponentFixture<CounterWiseSalesOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CounterWiseSalesOrderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CounterWiseSalesOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
