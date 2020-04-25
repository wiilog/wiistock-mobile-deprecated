import {Component, Input} from '@angular/core';
import {HeaderConfig} from "@helpers/components/panel/model/header-config";
import {ListPanelItemConfig} from "@helpers/components/panel/model/list-panel/list-panel-item-config";


@Component({
    selector: 'wii-list-panel',
    templateUrl: 'list-panel.component.html'
})
export class ListPanelComponent {
    @Input()
    public header?: HeaderConfig;

    @Input()
    public body: Array<ListPanelItemConfig>;

    @Input()
    public boldValues: Array<string>;
}
