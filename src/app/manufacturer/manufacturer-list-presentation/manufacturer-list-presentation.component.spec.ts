import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManufacturerListPresentationComponent } from './manufacturer-list-presentation.component';

describe('ManufacturerListPresentationComponent', () => {
  let component: ManufacturerListPresentationComponent;
  let fixture: ComponentFixture<ManufacturerListPresentationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManufacturerListPresentationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManufacturerListPresentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
