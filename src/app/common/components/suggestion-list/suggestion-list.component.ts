import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {IconConfig} from '@app/common/components/panel/model/icon-config';
import {IonInfiniteScroll} from "@ionic/angular";


@Component({
    selector: 'wii-suggestion-list',
    templateUrl: 'suggestion-list.component.html',
    styleUrls: ['./suggestion-list.component.scss']
})
export class SuggestionListComponent implements OnInit {

    @ViewChild('infiniteScroll', {static: false})
    public infiniteScroll: IonInfiniteScroll;

    @Input()
    public title: string;

    @Input()
    public elements: Array<Array<{
        name: string;
        value: string|number;
    }>>;

    @Input()
    public loadMore: (infiniteScroll: IonInfiniteScroll) => void;

    ngOnInit(): void {
    }
}
