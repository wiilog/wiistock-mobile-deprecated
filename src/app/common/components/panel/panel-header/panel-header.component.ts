import {Component, EventEmitter, HostBinding, HostListener, Input, Output} from '@angular/core';
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

    @Input()
    public fireAction: boolean;

    @Output()
    public action: EventEmitter<Event>;

    public constructor() {
        this._subtitle = [];
        this.action = new EventEmitter<Event>();
    }

    @HostBinding('class.ion-activatable')
    @HostBinding('class.ripple-parent')
    public get hasRipple(): boolean {
        return this.fireAction;
    }

    @HostListener('click', ['$event'])
    public onClick(event: Event): void {
        this.action.emit(event);
    }

    @Input()
    public set subtitle(subtitle: string|Array<string>) {
        this._subtitle = subtitle
            ? (typeof subtitle === 'string' ? [subtitle] : subtitle)
            : [];
    }

    @Input()
    public set rightIcons(rightIcons: IconConfig|Array<IconConfig>) {
        this._rightIcons = rightIcons
            ? (Array.isArray(rightIcons) ? rightIcons : [rightIcons])
            : [];
    }

    public get subtitle(): string|Array<string> {
        return this._subtitle;
    }

    public get rightIcons(): IconConfig|Array<IconConfig> {
        return this._rightIcons;
    }

    public onLeftIconClick(event: Event): void {
        if (this.leftIcon.action) {
            this.leftIcon.action();
            event.preventDefault();
            event.stopPropagation();
        }
    }

    public onRightIconClick(event: Event, index: number): void {
        console.log('action right')
        if (this.rightIcons && this.rightIcons[index] && this.rightIcons[index].action) {
            this.rightIcons[index].action();
            event.preventDefault();
            event.stopPropagation();
        }
    }

    public get leftIconHasAction(): boolean {
        return Boolean(this.leftIcon.action);
    }

    public rightIconHasAction(index: number): boolean {
        return Boolean(this.rightIcons && this.rightIcons[index] && this.rightIcons[index].action);
    }
}
