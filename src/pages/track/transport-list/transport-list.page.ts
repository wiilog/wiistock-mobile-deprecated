import {Component, ViewChild} from '@angular/core';
import {ViewWillEnter} from '@ionic/angular';
import {PageComponent} from '@pages/page.component';
import {NavService} from '@app/common/services/nav/nav.service';
import { TransportRound } from '@entities/transport-round';
import {FormPanelComponent} from '@app/common/components/panel/form-panel/form-panel.component';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {FormatService} from '@app/common/services/format.service';
import {MapLocation} from '@app/common/components/leaflet-map/leaflet-map.component';
import {TransportCardMode} from '@app/common/components/transport-card/transport-card.component';
import {TransportRoundLine} from '@entities/transport-round-line';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {LoadingService} from "@app/common/services/loading.service";

@Component({
    selector: 'wii-transport-list',
    templateUrl: './transport-list.page.html',
    styleUrls: ['./transport-list.page.scss'],
})
export class TransportListPage extends PageComponent implements ViewWillEnter {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public headerConfig: HeaderConfig;

    public mode: TransportCardMode;

    public round: TransportRound;

    public markers: Array<MapLocation> = [];

    public mapVisible: boolean = false;

    public constructor(navService: NavService,
                       public formatService: FormatService,
                       private loadingService: LoadingService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.mode = this.currentNavParams.get('mode');
        this.round = this.currentNavParams.get('round');

        this.headerConfig = {
            title: `T${this.round.number}`,
            subtitle: [this.formatService.formatDate(this.round.date)],
            leftIcon: {
                name: 'track.svg'
            },
            ...(this.round.status === 'En cours' ? {
                rightBadge: {
                    label: `Tournée en cours`,
                    color: {
                        background: `#C4C7D5`,
                        font: `primary`,
                    },
                    inline: true
                }
            } : {})
        };

        this.refreshMarkers();
    }

    public showTransport(transport: TransportRoundLine) {
        this.navService.push(NavPathEnum.TRANSPORT_SHOW, {
            transport,
            round: this.round,
            mode: this.mode,
            callback: (transport) => this.updateTransportList(transport)
        });
    }

    public toggleMap() {
        this.mapVisible = !this.mapVisible;
    }

    public updateTransportList(transport: TransportRoundLine|undefined): void {
        const index = this.round.lines.findIndex((line => line.id === transport.id));
        this.round.lines[index].failure = true;

        this.refreshMarkers();
    }

    public refreshMarkers(): void {
        for (const line of this.round.lines) {
            this.markers.push({
                title: `${line.priority}. ${line.contact.name}`,
                latitude: Number(line.contact.latitude),
                longitude: Number(line.contact.longitude),
            });
        }
    }
}
