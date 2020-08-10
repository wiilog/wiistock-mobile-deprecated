import {Component, EventEmitter, Input, Output} from '@angular/core';
import {filter, take} from 'rxjs/operators';
import {from} from 'rxjs';
import {FormPanelItemComponent} from '@app/common/components/panel/model/form-panel/form-panel-item.component';
import {FormPanelCalendarConfig} from '@app/common/components/panel/model/form-panel/configs/form-panel-calendar-config';
import {FormPanelCalendarMode} from '@app/common/components/panel/form-panel/form-panel-calendar/form-panel-calendar-mode';
import * as moment from 'moment';
import {DatePicker} from '@ionic-native/date-picker/ngx';

@Component({
    selector: 'wii-form-panel-calendar',
    templateUrl: 'form-panel-calendar.component.html',
    styleUrls: ['./form-panel-calendar.component.scss']
})
export class FormPanelCalendarComponent implements FormPanelItemComponent<FormPanelCalendarConfig> {

    @Input()
    public inputConfig: FormPanelCalendarConfig;

    @Input()
    public value?: string;

    @Input()
    public label: string;

    @Input()
    public name: string;

    @Input()
    public errors?: { [errorName: string]: string };

    @Output()
    public valueChange: EventEmitter<string>;

    public constructor(private datePicker: DatePicker) {
        this.valueChange = new EventEmitter<string>();
    }

    private static ValueTo

    public get error(): string {
        return (this.inputConfig.required && !this.value)
            ? (this.errors && this.errors.required)
            : undefined;
    }

    public emptyValue(): void {
        this.value = '';
    }

    public onItemClicked(): void {
        from(this.datePicker.show({
            date: this.valueDate,
            mode: this.inputConfig.mode,
            androidTheme: this.datePicker.ANDROID_THEMES.THEME_HOLO_LIGHT,
            is24Hour: true
        }))
            .pipe(
                take(1),
                filter((pickedDate) => pickedDate instanceof Date)
            )
            .subscribe(
                (pickedDate) => {
                    this.value = moment(pickedDate).format(this.inputValueFormat);
                }
            );
    }

    public get formattedValue(): string {
        const format = 'DD/MM/YYYY' + (this.inputConfig.mode === FormPanelCalendarMode.DATETIME ? ' HH:mm' : '');
        return this.value
            ? moment(this.value, this.inputValueFormat).format(format)
            : ''
    }

    public get inputValueFormat(): string {
        return 'YYYY-MM-DD' + (this.inputConfig.mode === FormPanelCalendarMode.DATETIME ? '\THH:mm' : '');
    }

    public get valueDate(): Date {
        return this.value
            ? moment(this.value, this.inputValueFormat).toDate()
            : new Date()
    }

}
