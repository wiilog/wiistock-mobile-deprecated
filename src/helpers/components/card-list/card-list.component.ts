import {Component, Input, OnInit} from '@angular/core';
import {CardListColorEnum} from "@helpers/components/card-list/card-list-color.enum";
import {CardListConfig} from "@helpers/components/card-list/card-list-config";


@Component({
    selector: 'wii-card-list',
    templateUrl: 'card-list.component.html'
})
export class CardListComponent implements OnInit {
    @Input()
    public listIconName?: string;

    @Input()
    public color: CardListColorEnum;

    @Input()
    public config: Array<CardListConfig>;

    public headerClass: string;

    public ngOnInit(): void {
        this.headerClass = `card-header-${this.color}`;
    }

    public onCardClick(cardConfig: CardListConfig) {
        if (cardConfig.action) {
            cardConfig.action();
        }
    }
}
