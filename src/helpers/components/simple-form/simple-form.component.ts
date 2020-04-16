import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {IconConfig} from "@helpers/components/panel/model/icon-config";


@Component({
    selector: 'wii-simple-form',
    templateUrl: 'simple-form.component.html'
})
export class SimpleFormComponent implements OnInit {

    @Input()
    public title: string;

    @Input()
    public iconInfo: IconConfig;

    @Input()
    public info?: Array<{
        label: string;
        value: string;
    }>;

    @Input()
    public fields: Array<{
        name: string;
        label: string;
        type?: string;
        value?: string|number;
    }>;

    @Output()
    public submit: EventEmitter<{ [name: string]: string | number }>;

    public models: { [name: string]: string | number };

    public constructor() {
        this.submit = new EventEmitter<{[p: string]: string}>();
    }

    public ngOnInit() {
        this.models = this.fields.reduce(
            (acc, {name, value}) => ({
                ...acc,
                [name]: value
            }),
            {}
        );

        return true;
    }

    public onFormSubmit() {
        this.submit.emit(this.models)
    }

    public onInputChange(name: string, type: string, target: EventTarget): void {
        const {value} = (target as HTMLInputElement);
        this.models[name] = (type === 'number' ? Number(value) : value);
    }
}
