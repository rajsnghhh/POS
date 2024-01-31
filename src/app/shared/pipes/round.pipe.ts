import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'customRound'
})
export class CustomRoundPipe implements PipeTransform {
    transform(value: number | undefined | null): string {
        if (value == null) {
            return '0.00';
        }

        const roundedValue = value - Math.floor(value) < 0.5 ? Math.floor(value) : Math.ceil(value);
        return roundedValue.toFixed(2); // Display with two decimal places
    }
}
