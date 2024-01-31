import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchAssignComponent } from './batch-assign.component';

describe('BatchAssignComponent', () => {
  let component: BatchAssignComponent;
  let fixture: ComponentFixture<BatchAssignComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BatchAssignComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BatchAssignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
