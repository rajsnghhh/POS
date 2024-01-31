import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyGrnReportComponent } from './daily-grn-report.component';

describe('DailyGrnReportComponent', () => {
  let component: DailyGrnReportComponent;
  let fixture: ComponentFixture<DailyGrnReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DailyGrnReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyGrnReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
