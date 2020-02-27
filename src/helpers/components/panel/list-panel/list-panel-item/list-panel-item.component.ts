import {Component, Input} from '@angular/core';
import {IconConfig} from '@helpers/components/panel/model/icon-config';


@Component({
    selector: 'wii-list-panel-item',
    templateUrl: 'list-panel-item.component.html'
})
export class ListPanelItemComponent {

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
    public rightIcon?: IconConfig;

    @Input()
    public longPressAction?: (infos: {[name: string]: {label: string; value: string;};}) => void;

    public constructor() {
        this.boldValues = [];
    }

    public get infosArray(): Array<{label: string; value: string; key: string;}> {
        return Object.keys(this.infos).map((key) => ({
            key,
            ...(this.infos[key])
        }))
    }

    public onLongPress() {
        if (this.longPressAction) {
            this.longPressAction(this.infos);
        }
    }
}
