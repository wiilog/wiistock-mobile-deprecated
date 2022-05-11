import {Component, Input, OnInit} from '@angular/core';
import {TransportRoundLine} from '@entities/transport-round-line';
import {SimpleCardTitle} from '@app/common/components/simple-card/simple-card.component';
import {Platform} from '@ionic/angular';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {Emplacement} from '@entities/emplacement';
import {NavService} from '@app/common/services/nav/nav.service';

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

    public canClick: boolean;

    public titles: Array<SimpleCardTitle> = [];

    constructor(private navService: NavService, private platform: Platform) {
    }

    ngOnInit() {
        this.titles.push({
            title: `${this.transport.priority}. ${this.transport.contact.name}`,
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

    public click() {
        if(this.mode === TransportCardMode.STARTABLE && !this.transport.cancelled) {
            this.navService.push(NavPathEnum.FINISH_TRANSPORT, {
                transport: this.transport,
            });
        }
    }

    public navigate(event: any) {
        const contact = this.transport.contact;

        if (this.platform.is(`android`)) {
            window.location.href = `geo:${contact.latitude},${contact.longitude}?q=${contact.address}`;
        } else {
            window.location.href = `maps://maps.apple.com/?q=${contact.address}`;
        }

        event.stopPropagation();
    }

}
