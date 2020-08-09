import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {NgModel} from '@angular/forms';
import {FormPanelItemComponent} from '@app/common/components/panel/model/form-panel/form-panel-item.component';
import {FormPanelToggleConfig} from '@app/common/components/panel/model/form-panel/configs/form-panel-toggle-config';


@Component({
    selector: 'wii-form-panel-toggle',
    templateUrl: 'form-panel-toggle.component.html',
    styleUrls: ['./form-panel-toggle.component.scss']
})
export class FormPanelToggleComponent implements FormPanelItemComponent<FormPanelToggleConfig> {


    @ViewChild('inputComponent', {static: false})
    public inputComponent: NgModel;

    @Input()
    public inputConfig: FormPanelToggleConfig;

    @Input()
    public value?: string;

    @Input()
    public label: string;

    @Input()
    public name: string;

    @Input()
    public errors?: {[errorName: string]: string};

    @Output()
    public valueChange: EventEmitter<string>;

    public constructor() {
        this.valueChange = new EventEmitter<string>();
    }

    public onValueChange(value: string) {
        this.valueChange.emit(value);
    }

    public get error(): string {
        const errorsKeys = Object.keys(this.inputComponent.control.errors || {});
        return (errorsKeys.length > 0)
            ? this.errors[errorsKeys[0]]
            : undefined;
    }
}
