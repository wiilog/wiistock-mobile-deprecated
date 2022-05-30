import {Component, Input, ViewChild} from '@angular/core';
import {ViewWillEnter} from '@ionic/angular';
import {PageComponent} from '@pages/page.component';
import {NavService} from '@app/common/services/nav/nav.service';
import {FormPanelComponent} from '@app/common/components/panel/form-panel/form-panel.component';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {TransportCardMode} from '@app/common/components/transport-card/transport-card.component';
import {TransportRoundLine} from '@entities/transport-round-line';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';

@Component({
    selector: 'wii-transport-collect-natures',
    templateUrl: './transport-collect-natures.page.html',
    styleUrls: ['./transport-collect-natures.page.scss'],
})
export class TransportCollectNaturesPage extends PageComponent implements ViewWillEnter {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public headerConfig: HeaderConfig;

    public mode: TransportCardMode;

    @Input()
    public transport: TransportRoundLine;

    public constructor(navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.transport = this.currentNavParams.get('transport');

        this.headerConfig = {
            title: `Collecte`,
            subtitle: [`ODT${this.transport.number}`],
            leftIcon: {
                name: 'collect-hand.svg',
                color: `purple`,
            },
            rightBadge: {
                label: this.transport.type,
                icon: this.transport.type_icon,
                color: {
                    background: `#CBCBCB`,
                    font: `#666666`,
                },
                inline: true
            },
        };
    }

    public setCollectedQuantity(nature_id: number, value: number) {
        for(const nature of this.transport.natures_to_collect) {
            if(nature.nature_id === nature_id) {
                nature.collected_quantity = value;
                return;
            }
        }
    }

    public finishTransport() {
        this.navService.push(NavPathEnum.FINISH_TRANSPORT, {
            transport: this.transport,
        });
    }

}
