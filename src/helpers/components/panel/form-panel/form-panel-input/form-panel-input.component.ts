import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {FormPanelItemComponent} from '@helpers/components/panel/model/form-panel/form-panel-item-component';
import {TextInput} from 'ionic-angular';
import {FormPanelItemAvailable} from '@helpers/components/panel/model/form-panel-item-available';


@Component({
    selector: 'wii-form-panel-input',
    templateUrl: 'form-panel-input.component.html'
})
export class FormPanelInputComponent implements FormPanelItemComponent<FormPanelItemAvailable> {

    @ViewChild('inputComponent')
    public inputComponent: TextInput;

    @Input()
    public inputConfig: FormPanelItemAvailable;

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
        const errorsKeys = Object.keys(this.inputComponent.ngControl.errors || {});
        return (errorsKeys.length > 0)
            ? this.errors[errorsKeys[0]]
            : undefined;
    }

}
