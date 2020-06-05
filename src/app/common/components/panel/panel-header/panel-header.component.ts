import {Component, HostBinding, Input} from '@angular/core';
import {IconConfig} from '@app/common/components/panel/model/icon-config';


@Component({
    selector: 'wii-panel-header',
    templateUrl: 'panel-header.component.html',
    styleUrls: ['./panel-header.component.scss']
})
export class PanelHeaderComponent {

    @Input()
    public leftIcon: IconConfig;

    @Input()
    public title: string;

    @Input()
    public subtitle: string;

    @Input()
    public info: string;

    @Input()
    public rightIcon: IconConfig;

    @Input()
    @HostBinding('class.transparent-panel-header')
    public transparent?: boolean = false;

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

    public get leftIconHasAction(): boolean {
        return Boolean(this.leftIcon.action);
    }

    public get rightIconHasAction(): boolean {
        return Boolean(this.rightIcon.action);
    }
}
