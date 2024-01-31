import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockReturnComponent } from './stock-return.component';

describe('StockReturnComponent', () => {
  let component: StockReturnComponent;
  let fixture: ComponentFixture<StockReturnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StockReturnComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockReturnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
