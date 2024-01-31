import { Pipe, PipeTransform } from '@angular/core';
enum UTCToLocalTimeFormat {
  FULL = 'full',
  SHORT = 'short',
  SHORT_DATE = "shortDate",
  SHORT_TIME = "shortTime"
}

@Pipe({
  name: 'utcToLocalTime'
})

export class UTCToLocalTime implements PipeTransform {
  // transform(utcDate: Date, format: UTCToLocalTimeFormat | string): any {
  //   const browserLanuges = navigator.language;
  //   if (!utcDate) {
  //     return '';
  //   }
  //   if (format === UTCToLocalTimeFormat.SHORT) {
  //     const date = new Date(utcDate).toLocaleDateString(browserLanuges);
  //     const time = new Date(utcDate).toLocaleTimeString(browserLanuges);
  //     return `${date} ${time}`;
  //     //  return moment.utc(utcDate).format("MM/DD/YYYY hh:mm:ss");
  //   }
  //   else if (format === UTCToLocalTimeFormat.SHORT_DATE) {
  //     const date = new Date(utcDate).toLocaleDateString(browserLanuges);
  //     return `${date}`;
  //   }
  //   else if (format === UTCToLocalTimeFormat.SHORT_TIME) {
  //     const time = new Date(utcDate).toLocaleTimeString(browserLanuges);
  //     return `${time}`;
  //   } else {
  //     const date = new Date(utcDate).toLocaleDateString(browserLanuges);
  //     const time = new Date(utcDate).toLocaleTimeString(browserLanuges);
  //     return `${date} ${time}`;
  //   }

  // }
  transform(utcDate: Date, format: UTCToLocalTimeFormat | string): any {
    const browserLanguage = navigator.language;

    if (!utcDate) {
      return '';
    }

    // Ensure utcDate is treated as UTC
    const utcDateTime = new Date(utcDate);
    const dateOptions: Intl.DateTimeFormatOptions = { timeZone: 'UTC' };

    if (format === UTCToLocalTimeFormat.SHORT) {
      const date = utcDateTime.toLocaleDateString(browserLanguage, dateOptions);
      const time = utcDateTime.toLocaleTimeString(browserLanguage);
      return `${date} ${time}`;
    } else if (format === UTCToLocalTimeFormat.SHORT_DATE) {
      const date = utcDateTime.toLocaleDateString(browserLanguage, dateOptions);
      return `${date}`;
    } else if (format === UTCToLocalTimeFormat.SHORT_TIME) {
      const time = utcDateTime.toLocaleTimeString(browserLanguage);
      return `${time}`;
    } else {
      const date = utcDateTime.toLocaleDateString(browserLanguage, dateOptions);
      const time = utcDateTime.toLocaleTimeString(browserLanguage);
      return `${date} ${time}`;
    }
  }

}
