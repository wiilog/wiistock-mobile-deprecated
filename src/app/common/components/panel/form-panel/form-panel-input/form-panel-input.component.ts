import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {NgModel} from '@angular/forms';
import {FormPanelInputConfig} from '@app/common/components/panel/model/form-panel/form-panel-input-config';


@Component({
    selector: 'wii-form-panel-input',
    templateUrl: 'form-panel-input.component.html',
    styleUrls: ['./form-panel-input.component.scss']
})
export class FormPanelInputComponent {

    @ViewChild('inputComponent', {static: false})
    public inputComponent: NgModel;

    @Input()
    public inputConfig: FormPanelInputConfig;

    @Input()
    public value?: string;

    @Input()
    public label: string;

    @Input()
    public name: string;

    @Input()
    public errors?: {[erroName: string]: string};

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
