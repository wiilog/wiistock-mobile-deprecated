import {Component, Input, OnInit} from '@angular/core';
import {TransportRoundLine} from '@entities/transport-round-line';
import {SimpleCardTitle} from '@app/common/components/simple-card/simple-card.component';

export enum TransportCardMode {
    VIEW,
    STARTABLE,
}

@Component({
    selector: 'wii-transport-card',
    templateUrl: './transport-card.component.html',
    styleUrls: ['./transport-card.component.scss'],
})
export class TransportCardComponent implements OnInit {

    public modeViewOnly = TransportCardMode.VIEW;

    @Input()
    public transport: TransportRoundLine;

    @Input()
    public mode: TransportCardMode;

    public titles: Array<SimpleCardTitle> = [];

    ngOnInit() {
        this.titles.push({
            title: `${this.transport.priority}. ${this.transport.contact.contact}`,
            position: `left`,
        });

        this.titles.push({
            title: this.transport.type,
            image: this.transport.type_icon,
            position: `right`,
        });

        if(this.transport.collect) {
            this.titles.push({
                title: this.transport.collect.type,
                image: this.transport.collect.type_icon,
                position: `right`,
            });
        }

    }

}
