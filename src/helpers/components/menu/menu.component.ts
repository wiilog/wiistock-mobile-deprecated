import {Component, Input} from '@angular/core';
import {MenuConfig} from "@helpers/components/menu/menu-config";


@Component({
    selector: 'wii-menu',
    templateUrl: 'menu.component.html'
})
export class MenuComponent {
    @Input()
    public config: Array<MenuConfig>;
}
