import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { CommonDialogService } from '@core/common-dialog/common-dialog.service';
import { ResponseHeader } from '@core/domain-classes/response-header';
import { User } from '@core/domain-classes/user';
import { UserResource } from '@core/domain-classes/user-resource';
import { TranslationService } from '@core/services/translation.service';
import { ToastrService } from 'ngx-toastr';
import { fromEvent, merge, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { BaseComponent } from 'src/app/base.component';
import { ResetPasswordComponent } from '../reset-password/reset-password.component';
import { UserService } from '../user.service';
import { UserDataSource } from './user-datasource';
import * as XLSX from 'xlsx';


@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent extends BaseComponent implements OnInit, AfterViewInit {
  dataSource: UserDataSource;
  downloadUserData:any;
  users: User[] = [];
  displayedColumns: string[] = ['action', 'email', 'firstName', 'lastName', 'phoneNumber', 'isActive'];
  footerToDisplayed = ['footer'];
  isLoadingResults = true;
  userResource: UserResource;
  loading$: Observable<boolean>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('input') input: ElementRef;

  constructor(
    private userService: UserService,
    private toastrService: ToastrService,
    private commonDialogService: CommonDialogService,
    private dialog: MatDialog,
    private router: Router,
    public translationService: TranslationService) {
    super(translationService);
    this.getLangDir();
    this.userResource = new UserResource();
    this.userResource.pageSize = 10;
    this.userResource.orderBy = 'email desc'
  }

  ngOnInit(): void {
    this.dataSource = new UserDataSource(this.userService);
    this.dataSource.loadUsers(this.userResource);
    this.getResourceParameter();
  }

  ngAfterViewInit() {
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    this.sub$.sink = merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        tap((c: any) => {
          this.userResource.skip = this.paginator.pageIndex * this.paginator.pageSize;
          this.userResource.pageSize = this.paginator.pageSize;
          this.userResource.orderBy = this.sort.active + ' ' + this.sort.direction;
          this.dataSource.loadUsers(this.userResource);
        })
      )
      .subscribe();

    this.sub$.sink = fromEvent(this.input.nativeElement, 'keyup')
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        tap(() => {
          this.paginator.pageIndex = 0;
          this.userResource.name = this.input.nativeElement.value;
          this.dataSource.loadUsers(this.userResource);
        })
      )
      .subscribe();
  }

  deleteUser(user: User) {
    this.sub$.sink = this.commonDialogService
      .deleteConformationDialog(`${this.translationService.getValue('ARE_YOU_SURE_YOU_WANT_TO_DELETE')} ${user.email}`)
      .subscribe((isTrue: boolean) => {
        if (isTrue) {
          this.sub$.sink = this.userService.deleteUser(user.id)
            .subscribe(() => {
              this.toastrService.success(this.translationService.getValue('USER_DELETED_SUCCESSFULLY'));
              this.paginator.pageIndex = 0;
              this.userResource.name = this.input.nativeElement.value;
              this.dataSource.loadUsers(this.userResource);
            });
        }
      });
  }

  getResourceParameter() {
    this.sub$.sink = this.dataSource.responseHeaderSubject$
      .subscribe((c: ResponseHeader) => {
        if (c) {
          this.userResource.pageSize = c.pageSize;
          this.userResource.skip = c.skip;
          this.userResource.totalCount = c.totalCount;
        }
      });
  }

  resetPassword(user: User): void {
    this.dialog.open(ResetPasswordComponent, {
      width: '350px',
      direction:this.langDir,
      data: Object.assign({}, user)
    });
  }

  editUser(userId: string) {
    this.router.navigate(['/users/manage', userId])
  }

  userPermission(userId: string) {
    this.router.navigate(['/users/permission', userId])
  }

  onDownloadUser() {
    this.userResource.pageSize=5000;
    this.userService.downloadUsers(this.userResource)
      .subscribe(data => {
        this.downloadUserData = data.body;
        let heading = [[
          this.translationService.getValue('First Name'),
          this.translationService.getValue('Last Name'),
          this.translationService.getValue('Email'),
          this.translationService.getValue('Phone Number'),
          this.translationService.getValue('Status')
        ]];

        let userDetails = [];
        this.downloadUserData.forEach((data: any) => {
          userDetails.push({
            'First Name': data.firstName,
            'Last Name': data.lastName,
            'Email': data.email,
            'Phone Number': data.phoneNumber,
            'Status': data.isActive ? 'Active' : 'Inactive',
          });
        });

        let workBook = XLSX.utils.book_new();
        XLSX.utils.sheet_add_aoa(workBook, heading);
        let workSheet = XLSX.utils.sheet_add_json(workBook, userDetails, { origin: "A2", skipHeader: true });
        XLSX.utils.book_append_sheet(workBook, workSheet, this.translationService.getValue('User List'));
        XLSX.writeFile(workBook, this.translationService.getValue('User List') + ".xlsx");
      });
  }
}
