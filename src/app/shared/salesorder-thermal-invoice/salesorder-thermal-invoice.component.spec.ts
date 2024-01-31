import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesorderThermalInvoiceComponent } from './salesorder-thermal-invoice.component';

describe('SalesorderThermalInvoiceComponent', () => {
  let component: SalesorderThermalInvoiceComponent;
  let fixture: ComponentFixture<SalesorderThermalInvoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SalesorderThermalInvoiceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesorderThermalInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
