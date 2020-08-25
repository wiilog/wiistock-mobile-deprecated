import {Component, HostBinding, Input} from '@angular/core';
import {CardListColorEnum} from '@app/common/components/card-list/card-list-color.enum';
import {CardListConfig} from '@app/common/components/card-list/card-list-config';
import {IconConfig} from '@app/common/components/panel/model/icon-config';


@Component({
    selector: 'wii-card-list',
    templateUrl: 'card-list.component.html',
    styleUrls: ['./card-list.component.scss']
})
export class CardListComponent {
    @Input()
    public listIconName?: string;

    @HostBinding('attr.class')
    @Input()
    public color: CardListColorEnum;

    @Input()
    public config: Array<CardListConfig>;

    public onCardClick(cardConfig: CardListConfig) {
        if (cardConfig.action) {
            cardConfig.action();
        }
    }
}
