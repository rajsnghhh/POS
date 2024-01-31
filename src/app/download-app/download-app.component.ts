import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-download-app',
  templateUrl: './download-app.component.html',
  styleUrls: ['./download-app.component.scss']
})
export class DownloadAppComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  downloadURI() {
    var link = document.createElement("a");
    // link.href = 'https://developer.shyamfuture.in/maitricomplex/Android.apk';
    link.href = 'https://developer.shyamfuture.in/Maitri-developement/Android.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
