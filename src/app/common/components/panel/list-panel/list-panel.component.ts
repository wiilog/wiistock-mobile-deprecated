import {Component, Input} from '@angular/core';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';
import {ActionConfig} from '@app/common/components/panel/model/action-config';


@Component({
    selector: 'wii-list-panel',
    templateUrl: 'list-panel.component.html',
    styleUrls: ['./list-panel.component.scss']
})
export class ListPanelComponent {
    @Input()
    public header?: HeaderConfig;

    @Input()
    public actions?: Array<ActionConfig>;

    @Input()
    public body: Array<ListPanelItemConfig>;

    @Input()
    public boldValues: Array<string>;

    @Input()
    public identifierName?: string;

    public onHeaderClicked(event: Event): void {
        if (this.header && this.header.action) {
            this.header.action(event);
        }
    }

    public get trackByGenerator(): (index: number, item: ListPanelItemConfig) => any|undefined {
        return this.identifierName
            ? (index: number, item: ListPanelItemConfig) => this.trackBy(index, item)
            : undefined;
    }

    private trackBy(_: number, item: ListPanelItemConfig): string|undefined {
        const info = (this.identifierName && item) ? item.infos[this.identifierName] : undefined;
        return info && info.value;
    }
}
