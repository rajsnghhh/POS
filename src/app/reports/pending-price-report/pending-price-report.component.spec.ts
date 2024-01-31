import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingPriceReportComponent } from './pending-price-report.component';

describe('PendingPriceReportComponent', () => {
  let component: PendingPriceReportComponent;
  let fixture: ComponentFixture<PendingPriceReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PendingPriceReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingPriceReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
