import {Component, Input} from '@angular/core';
import {ListHeaderConfig} from "@helpers/components/list/model/list-header-config";
import {ListElementConfig} from "@helpers/components/list/model/list-element-config";

@Component({
    selector: 'wii-list',
    templateUrl: 'list.component.html'
})
export class ListComponent {
    @Input()
    public header: ListHeaderConfig;

    @Input()
    public body: Array<ListElementConfig>;

    @Input()
    public boldValues: Array<string>;
}
