import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotificationComponent } from './notification.component';
import { AddPushNotificationComponent } from './add-push-notification/add-push-notification.component';

const routes: Routes = [
  {
    path:'',
    component: NotificationComponent
  },
  {
    path:'add-push-notification',
    component: AddPushNotificationComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotificationRoutingModule { }
