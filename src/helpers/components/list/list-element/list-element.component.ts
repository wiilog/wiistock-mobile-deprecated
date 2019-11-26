import {Component, Input} from '@angular/core';
import {ListIconConfig} from '@helpers/components/list/model/list-icon-config';

@Component({
    selector: 'wii-list-element',
    templateUrl: 'list-element.component.html'
})
export class ListElementComponent {

    @Input()
    public infos: {
        [name: string]: {
            label: string;
            value: string;
        };
    };

    @Input()
    public boldValues?: Array<string>;

    @Input()
    public rightIcon?: ListIconConfig;

    public constructor() {
        this.boldValues = [];
    }

    public get infosArray(): Array<{label: string; value: string; key: string;}> {
        return Object.keys(this.infos).map((key) => ({
            key,
            ...(this.infos[key])
        }))
    }
}
