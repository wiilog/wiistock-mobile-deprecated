import {Component, Input} from '@angular/core';
import {ListIconConfig} from '@helpers/components/list/model/list-icon-config';

@Component({
    selector: 'wii-list-header',
    templateUrl: 'list-element.component.html'
})
export class ListElementComponent {

    @Input()
    public infos: Array<{
        [name: string]: {
            label: string;
            value: string;
        };
    }>;

    @Input()
    public boldValues?: Array<string>;

    @Input()
    public rightIcon?: ListIconConfig;
}
