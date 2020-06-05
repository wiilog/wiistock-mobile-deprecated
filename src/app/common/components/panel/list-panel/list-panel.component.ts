import {Component, Input} from '@angular/core';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';


@Component({
    selector: 'wii-list-panel',
    templateUrl: 'list-panel.component.html',
    styleUrls: [
        './list-panel.component.scss'
    ]
})
export class ListPanelComponent {
    @Input()
    public header?: HeaderConfig;

    @Input()
    public body: Array<ListPanelItemConfig>;

    @Input()
    public boldValues: Array<string>;
}
