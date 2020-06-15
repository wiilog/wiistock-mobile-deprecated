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
    public info: string;

    public _rightIcons: Array<IconConfig>;

    public _subtitle: Array<string>;

    @Input()
    @HostBinding('class.transparent-panel-header')
    public transparent?: boolean = false;

    public constructor() {
        this._subtitle = [];
    }

    @Input()
    public set subtitle(subtitle: string|Array<string>) {
        this._subtitle = subtitle
            ? (typeof subtitle === 'string' ? [subtitle] : subtitle)
            : [];
    };

    public get subtitle(): string|Array<string> {
        return this._subtitle;
    };

    @Input()
    public set rightIcons(rightIcons: IconConfig|Array<IconConfig>) {
        this._rightIcons = rightIcons
            ? (Array.isArray(rightIcons) ? rightIcons : [rightIcons])
            : [];
    };

    public get rightIcons(): IconConfig|Array<IconConfig> {
        return this._rightIcons;
    };

    public onLeftIconClick(): void {
        if (this.leftIcon.action) {
            this.leftIcon.action();
        }
    }

    public onRightIconClick(index: number): void {
        if (this.rightIcons && this.rightIcons[index] && this.rightIcons[index].action) {
            this.rightIcons[index].action();
        }
    }

    public get leftIconHasAction(): boolean {
        return Boolean(this.leftIcon.action);
    }

    public rightIconHasAction(index: number): boolean {
        return Boolean(this.rightIcons && this.rightIcons[index] && this.rightIcons[index].action);
    }
}
