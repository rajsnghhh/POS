import { TestBed } from '@angular/core/testing';

import { RewardsPointService } from './rewards-point.service';

describe('RewardsPointService', () => {
  let service: RewardsPointService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RewardsPointService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
