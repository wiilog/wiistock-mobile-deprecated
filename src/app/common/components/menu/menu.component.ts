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

    public get firstPlaceholderDisplayed(): boolean {
        const columnLength = this.columnLength;
        return (
            columnLength !== -1
            && (this.config.length % columnLength !== 0)
        );
    }

    public get secondPlaceholderDisplayed(): boolean {
        const columnLength = this.columnLength;
        return (
            columnLength === 3
            && this.firstPlaceholderDisplayed
            && (this.config.length % columnLength === 1)
        );
    }

    public get columnLength(): number {
        return (
            this.columns === ColumnNumber.TWO ? 2 :
            this.columns === ColumnNumber.THREE ? 3 :
            -1
        );
    }
}
