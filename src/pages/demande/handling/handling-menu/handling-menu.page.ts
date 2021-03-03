import {Component, ViewChild} from '@angular/core';
import {Handling} from '@entities/handling';
import {CardListConfig} from '@app/common/components/card-list/card-list-config';
import {CardListColorEnum} from '@app/common/components/card-list/card-list-color.enum';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {NavService} from '@app/common/services/nav.service';
import {PageComponent} from '@pages/page.component';
import {HandlingValidatePageRoutingModule} from '@pages/demande/handling/handling-validate/handling-validate-routing.module';
import * as moment from 'moment';
import {Subject, zip} from 'rxjs';
import {Translation} from '@entities/translation';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';


@Component({
    selector: 'wii-handling-menu',
    templateUrl: './handling-menu.page.html',
    styleUrls: ['./handling-menu.page.scss'],
})
export class HandlingMenuPage extends PageComponent {
    public readonly scannerMode = BarcodeScannerModeEnum.TOOL_SELECTED_LABEL

    public handlings: Array<Handling>;
    public handlingsListConfig: Array<CardListConfig>;
    public readonly handlingsListColor = CardListColorEnum.GREEN;
    public readonly handlingsIconName = 'people.svg';

    public hasLoaded: boolean;

    public selectedSubject$: Subject<string>;

    private handlingsTranslations: {[label: string]: string};

    public constructor(private mainHeaderService: MainHeaderService,
                       private sqliteService: SqliteService,
                       navService: NavService) {
        super(navService);
        this.selectedSubject$ = new Subject<string>();
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        zip(
            this.sqliteService.findAll('handling'),
            this.sqliteService.findBy('translations', [`menu LIKE 'services'`])
        )
        .subscribe(([handlings, handlingsTranslations]: [Array<Handling>, Array<Translation>]) => {
            this.handlingsTranslations = handlingsTranslations.reduce((acc, {label, translation}) => ({
                ...acc,
                [label]: translation
            }), {});
            this.handlings = handlings

            this.refreshHandlingListConfig(this.handlings);
            this.refreshSubTitle(this.handlings);

            this.hasLoaded = true;
        });
    }

    public onBarcodeScanned(barcode: string) {
        const filteredHandling = this.handlings.filter(({subject}) => (barcode === subject))

        if (filteredHandling.length === 1) {
            this.onSearchCleared();
            this.navService.push(HandlingValidatePageRoutingModule.PATH, {handling: filteredHandling[0]});
        }
        else {
            this.selectedSubject$.next(barcode);
            this.refreshHandlingListConfig(filteredHandling);
            this.refreshSubTitle(filteredHandling);
        }
    }

    public onSearchCleared() {
        this.selectedSubject$.next(undefined);

        this.refreshHandlingListConfig(this.handlings);
        this.refreshSubTitle(this.handlings);
    }

    private refreshHandlingListConfig(handlings: Array<Handling>) {
        this.handlingsListConfig = handlings
            .sort(({desiredDate: desiredDate1}, {desiredDate: desiredDate2}) => {
                const momentDesiredDate1 = moment(desiredDate1, 'DD/MM/YYYY HH:mm:ss')
                const momentDesiredDate2 = moment(desiredDate2, 'DD/MM/YYYY HH:mm:ss')
                return (
                    momentDesiredDate1.isBefore(momentDesiredDate2) ? -1 :
                        momentDesiredDate1.isAfter(momentDesiredDate2) ? 1 :
                            0
                );
            })
            .map((handling) => ({
                title: {
                    label: 'Demandeur',
                    value: handling.requester
                },
                customColor: handling.color,
                content: [
                    {label: 'Numéro', value: handling.number},
                    {label: 'Date attendue', value: handling.desiredDate || ''},
                    {label: 'Chargement', value: handling.source || ''},
                    {label: 'Déchargement', value: handling.destination || ''},
                    {label: this.handlingsTranslations['Objet'] || 'Objet', value: handling.subject},
                    {label: this.handlingsTranslations['Nombre d\'opération(s) réalisée(s)'] || 'Nombre d\'opération(s) réalisée(s)', value: `${handling.carriedOutOperationCount || ''}`},
                    {label: 'Type', value: handling.typeLabel},
                    (handling.emergency
                        ? {label: 'Urgence', value: handling.emergency || ''}
                        : undefined)
                ].filter((item) => item),
                ...(handling.emergency
                    ? {
                        rightIcon: {
                            name: 'exclamation-triangle.svg',
                            color: 'danger'
                        }
                    }
                    : {}),
                action: () => {
                    this.navService.push(HandlingValidatePageRoutingModule.PATH, {handling});
                }
            }));
    }

    public refreshSubTitle(handlings: Array<Handling>): void {
        const handlingsLength = handlings.length;
        this.mainHeaderService.emitSubTitle(`${handlingsLength === 0 ? 'Aucune' : handlingsLength} demande${handlingsLength > 1 ? 's' : ''}`)
    }
}
