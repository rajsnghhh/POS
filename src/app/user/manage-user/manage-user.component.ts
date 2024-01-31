import { Component, OnInit } from '@angular/core';
import { FormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Role } from '@core/domain-classes/role';
import { Counter } from '@core/domain-classes/role';
import { User } from '@core/domain-classes/user';
import { CommonService } from '@core/services/common.service';
import { TranslationService } from '@core/services/translation.service';
import { environment } from '@environments/environment';
import { ToastrService } from 'ngx-toastr';
import { BaseComponent } from 'src/app/base.component';
import { UserService } from '../user.service';


@Component({
  selector: 'app-manage-user',
  templateUrl: './manage-user.component.html',
  styleUrls: ['./manage-user.component.scss']
})
export class ManageUserComponent extends BaseComponent implements OnInit {
  user: User;
  userForm: UntypedFormGroup;
  roleList: Role[];
  // counterList: Counter[] = [];
  counterList: Array<any> = [];
  CSDList: Array<any> = [];
  isEditMode = false;
  selectedRoles: Role[] = [];
  imgSrc: string | ArrayBuffer;
  isImageUpdate: boolean = false;
  constructor(private fb: UntypedFormBuilder,
    private router: Router,
    private activeRoute: ActivatedRoute,
    private userService: UserService,
    private toastrService: ToastrService,
    private commonService: CommonService,
    public translationService: TranslationService) {
    super(translationService);
    this.getLangDir();
  }

  ngOnInit(): void {
    this.createUserForm();
    this.sub$.sink = this.activeRoute.data.subscribe(
      (data: { user: User }) => {
        if (data.user) {
          this.isEditMode = true;
          this.userForm.patchValue(data.user);
          this.user = data.user;
          if (this.user.profilePhoto) {
            this.imgSrc = environment.apiUrl + this.user.profilePhoto;
          }
        } else {
          this.userForm.get('password').setValidators([Validators.required, Validators.minLength(6)]);
          this.userForm.get('confirmPassword').setValidators([Validators.required]);
        }
      });
    this.getRoles();
    this.getCounterList();
    this.getCSDList();
  }

  createUserForm() {
    this.userForm = this.fb.group({
      id: [''],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      password: [''],
      confirmPassword: [''],
      address: [''],
      pinCode: [''],
      isActive: [true],
      counterId: [''],/* 8ab39510-20ee-4b1c-0792-08dbdba209f7 */
      nonCSDCanteensId: ['f7c14269-2a89-4f89-0b8d-08dbde8dbe73']
    }, {
      validator: this.checkPasswords
    });
  }

  checkPasswords(group: UntypedFormGroup) {
    let pass = group.get('password').value;
    let confirmPass = group.get('confirmPassword').value;
    return pass === confirmPass ? null : { notSame: true }
  }

  onFileSelect($event) {
    const fileSelected = $event.target.files[0];
    if (!fileSelected) {
      return;
    }
    const mimeType = fileSelected.type;
    if (mimeType.match(/image\/*/) == null) {
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(fileSelected);
    // tslint:disable-next-line: variable-name
    reader.onload = (_event) => {
      this.imgSrc = reader.result;
      this.isImageUpdate = true;
      $event.target.value = '';
    }
  }

  onRemoveImage() {
    this.isImageUpdate = true;
    this.imgSrc = '';
  }

  saveUser() {
    if (this.userForm.valid) {
      const user = this.createBuildObject();
      if (this.isEditMode) {
        this.sub$.sink = this.userService.updateUser(user).subscribe(() => {
          this.toastrService.success(this.translationService.getValue('USER_UPDATED_SUCCESSFULLY'));
          this.router.navigate(['/users']);
        });
      } else {
        this.sub$.sink = this.userService.addUser(user).subscribe(() => {
          this.toastrService.success(this.translationService.getValue('USER_CREATED_SUCCESSFULLY'));
          this.router.navigate(['/users']);
        });
      }
    } else {
      this.userForm.markAllAsTouched();
    }
  }

  createBuildObject(): User {
    const userId = this.userForm.get('id').value;
    const user: User = {
      id: userId,
      firstName: this.userForm.get('firstName').value,
      lastName: this.userForm.get('lastName').value,
      email: this.userForm.get('email').value,
      phoneNumber: this.userForm.get('phoneNumber').value,
      password: this.userForm.get('password').value,
      userName: this.userForm.get('email').value,
      pinCode: this.userForm.get('pinCode').value,
      isActive: this.userForm.get('isActive').value,
      address: this.userForm.get('address').value,
      counterId: this.userForm.get('counterId').value,
      nonCSDCanteensId: this.userForm.get('nonCSDCanteensId').value,
      userRoles: this.getSelectedRoles(),
      isImageUpdate: this.isImageUpdate,
      imgSrc: this.imgSrc as string
    }
    return user;
  }

  getSelectedRoles() {
    return this.selectedRoles.map((role) => {
      return {
        userId: this.userForm.get('id').value,
        roleId: role.id
      }
    })
  }

  getRoles() {
    this.sub$.sink = this.commonService.getRoles().subscribe((roles: Role[]) => {
      this.roleList = roles;
      console.log(this.roleList);

      if (this.isEditMode) {
        const selectedRoleIds = this.user.userRoles.map(c => c.roleId);
        this.selectedRoles = this.roleList.filter(c => selectedRoleIds.indexOf(c.id) > -1);
      }
    });
  }

  getCounterList() {
    this.sub$.sink = this.commonService.getCounter().subscribe((res: any) => {
      this.counterList = res.data;
      console.log(this.counterList);

    });
  }

  getCSDList() {
    this.sub$.sink = this.commonService.getCSDList().subscribe((res: any) => {
      this.CSDList = res.data;
      console.log(this.CSDList);

    });
  }


  onlyInteger(event: any) {
    const charCode = event.keyCode;
    if (charCode >= 48 && charCode <= 57) {
      return true;
    } else {
      event.preventDefault();
      return false;
    }
  }
}
