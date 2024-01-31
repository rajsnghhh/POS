import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CityResourceParameter } from '@core/domain-classes/city-resource-parameter';
import { Reward } from '@core/domain-classes/reward-point';
import { CityDataSource } from 'src/app/city/city-list/city-datasource';
import { ManageRewardComponent } from '../manage-reward/manage-reward.component';

@Component({
  selector: 'app-rewards-point-lists',
  templateUrl: './rewards-point-lists.component.html',
  styleUrls: ['./rewards-point-lists.component.scss']
})
export class RewardsPointListsComponent implements OnInit {
  dataSource: CityDataSource;
  cityResource: CityResourceParameter;
  displayedColumns: string[] = ['action', 'fromAmount', 'toAmount', 'rewardPoint'];
  columnsToDisplay: string[] = ["footer"];

  constructor(  private dialog: MatDialog,) {
    this.cityResource = new CityResourceParameter();
    this.cityResource.pageSize = 10;
    this.cityResource.orderBy = 'cityName asc'
  }

  ngOnInit(): void {
  }


  addReward(reward: Reward): void {
    let dialogRef = this.dialog.open(ManageRewardComponent, {
      width: '350px',
      // direction:this.langDir,
      data: Object.assign({}, reward)
    });
    dialogRef.afterClosed().subscribe(data => {
      if (data) {
        this.dataSource.loadData(this.cityResource);
      }
    })
  }
}
