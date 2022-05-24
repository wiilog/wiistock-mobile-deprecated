import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {FormPanelParam} from '@app/common/directives/form-panel/form-panel-param';
import {FormViewerParam} from '@app/common/directives/form-viewer/form-viewer-param';
import {FormPanelComponent} from '@app/common/components/panel/form-panel/form-panel.component';
import {NatureWithQuantity} from '@app/common/components/panel/model/form-viewer/form-viewer-table-config';
import {FormViewerTableComponent} from '@app/common/components/panel/form-panel/form-viewer-table/form-viewer-table.component';

@Component({
    selector: 'wii-pack-count',
    templateUrl: './pack-count.component.html',
    styleUrls: ['./pack-count.component.scss'],
})
export class PackCountComponent implements OnInit {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    @Input()
    public title: string;

    @Input()
    public icon: string;

    @Input()
    public packs: Array<any>;

    @Input()
    public body: Array<FormPanelParam>;

    public headerConfig: HeaderConfig;
    public detailsConfig: Array<FormViewerParam>;

    constructor() {
    }

    ngOnInit() {
        let packsCount = 0;
        for(const pack of this.packs) {
            if(pack.collected_quantity) {
                packsCount += pack.collected_quantity;
            } else {
                packsCount += 1;
            }
        }

        this.headerConfig = {
            title: this.title,
            subtitle: [`${packsCount} colis`],
            leftIcon: {
                name: this.icon ?? 'scanned-pack.svg',
            }
        };

        const natures: {[name: string]: NatureWithQuantity} = {};
        for(const pack of this.packs) {
            if(!natures[pack.nature]) {
                natures[pack.nature] = {
                    color: pack.color,
                    title: pack.nature,
                    label: `Quantité`,
                    value: 0,
                }
            }

            if(pack.collected_quantity) {
                natures[pack.nature].value = natures[pack.nature].value as number + pack.collected_quantity;
            } else {
                natures[pack.nature].value = natures[pack.nature].value as number + 1;
            }
        }

        this.detailsConfig = [{
            item: FormViewerTableComponent,
            config: {
                label: ``,
                value: Object.values(natures),
            }
        }];
    }

}
