import {Component, Input} from '@angular/core';
import {MenuConfig} from '@app/common/components/menu/menu-config';


@Component({
    selector: 'wii-menu',
    templateUrl: 'menu.component.html',
    styleUrls: ['./menu.component.scss']
})
export class MenuComponent {
    @Input()
    public config: Array<MenuConfig>;
}
