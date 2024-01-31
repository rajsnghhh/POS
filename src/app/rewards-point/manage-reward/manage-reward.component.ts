import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Country } from '@core/domain-classes/country';
import { Reward } from '@core/domain-classes/reward-point';
import { RewardsPointService } from '../rewards-point.service';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from '@core/services/common.service';
import { BaseComponent } from 'src/app/base.component';
import { TranslationService } from '@core/services/translation.service';

@Component({
  selector: 'app-manage-reward',
  templateUrl: './manage-reward.component.html',
  styleUrls: ['./manage-reward.component.scss']
})
export class ManageRewardComponent extends BaseComponent implements OnInit {

  isEdit: boolean = false;
  rewardForm: UntypedFormGroup;
  countryList: Country[] = [];


  constructor(
    public dialogRef: MatDialogRef<ManageRewardComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Reward,
    private rewardService: RewardsPointService,
    private toastrService: ToastrService,
    private fb: UntypedFormBuilder,
    private commonService: CommonService,
    public translationService: TranslationService) {
    super(translationService);
    this.getLangDir();
  }

  ngOnInit(): void {
    this.createForm();
    this.getCountries()
    if (this.data.id) {
      this.rewardForm.patchValue(this.data);
      this.isEdit = true;
    }
  }

  createForm() {
    this.rewardForm = this.fb.group({
      fromAmount: ['', Validators.required],
      toAmount: ['', Validators.required],
      rewardPoint: ['', Validators.required]
    });
  }

  getCountries() {
    // this.sub$.sink = this.commonService.getCountry().subscribe(c => this.countryList = c);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  saveReward(): void {
    if (!this.rewardForm.valid) {
      this.rewardForm.markAllAsTouched();
      return;
    }
    const reward: Reward = this.rewardForm.value;
    // if (this.data.id) {
    //   this.cityService.updateCity(city.id, city).subscribe(() => {
    //     this.toastrService.success(this.translationService.getValue('CITY_SAVED_SUCCESSFULLY'));
    //     this.dialogRef.close(city);
    //   });
    // } else {
    //   this.cityService.saveCity(city).subscribe((c) => {
    //     this.toastrService.success(this.translationService.getValue('CITY_SAVED_SUCCESSFULLY'));
    //     this.dialogRef.close(city);
    //   });
    // }
  }
}

