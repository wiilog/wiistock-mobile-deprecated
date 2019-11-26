import {Component, Input} from '@angular/core';
import {ListIconConfig} from '@helpers/components/list/model/list-icon-config';

@Component({
    selector: 'wii-list-header',
    templateUrl: 'list-header.component.html'
})
export class ListHeaderComponent {

    @Input()
    public leftIcon: ListIconConfig;

    @Input()
    public title: string;

    @Input()
    public subtitle: string;

    @Input()
    public info: string;

    @Input()
    public rightIcon: ListIconConfig;

    public onLeftIconClick(): void {
        if (this.leftIcon.action) {
            this.leftIcon.action();
        }
    }

    public onRightIconClick(): void {
        if (this.rightIcon.action) {
            this.rightIcon.action();
        }
    }
}
