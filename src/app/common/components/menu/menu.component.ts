import {Component, Input} from '@angular/core';
import {ColumnNumber, MenuConfig} from '@app/common/components/menu/menu-config';


@Component({
    selector: 'wii-menu',
    templateUrl: 'menu.component.html',
    styleUrls: ['./menu.component.scss']
})
export class MenuComponent {
    public readonly ColumnNumber = ColumnNumber;

    @Input()
    public config: Array<MenuConfig>;

    @Input()
    public columns: number = ColumnNumber.TWO;
}
