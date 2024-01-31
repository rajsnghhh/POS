import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { UserAuth } from '@core/domain-classes/user-auth';
import { SecurityService } from '@core/security/security.service';
import { CommonService } from '@core/services/common.service';
import { TranslationService } from '@core/services/translation.service';
import { environment } from '@environments/environment';
import { filter } from 'rxjs/operators';
import { BaseComponent } from 'src/app/base.component';
@Component({
  selector: 'app-second-header',
  templateUrl: './second-header.component.html',
  styleUrls: ['./second-header.component.scss']
})
export class SecondHeaderComponent extends BaseComponent implements OnInit {

  appUserAuth: UserAuth = null;
  currentUrl: string = "dashboard";
  constructor(
    private securityService: SecurityService,
    private router: Router,
    private commonService: CommonService,
    public translationService: TranslationService) {
    super(translationService);
    this.getLangDir();
  }

  ngOnInit() {
    this.setTopLogAndName();
    this.routerNavigate();
  }

  setTopLogAndName() {
    this.sub$.sink = this.securityService.securityObject$
      .subscribe(c => {
        if (c) {
          this.appUserAuth = c;
          if (this.appUserAuth.profilePhoto) {
            this.appUserAuth.profilePhoto = `${environment.apiUrl}${this.appUserAuth.profilePhoto}`
          }
        }
      })
  }

  routerNavigate() {
    this.sub$.sink = this.commonService.currentUrl$.subscribe(c => {
      this.currentUrl = c;
    });
  }

  getState(currentMenu) {
    if (currentMenu.active) {
      return 'down';
    } else {
      return 'up';
    }
  }

  routeLink(route: any) {
    this.router.navigate([route])
      .then(() => {
        window.location.reload();
      });
  }

}
