import {Component} from '@angular/core';
import {Handling} from '@entities/handling';
import {CardListConfig} from '@app/common/components/card-list/card-list-config';
import {CardListColorEnum} from '@app/common/components/card-list/card-list-color.enum';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {NavService} from '@app/common/services/nav.service';
import {PageComponent} from '@pages/page.component';
import * as moment from 'moment';
import {Subject, zip} from 'rxjs';
import {Translations} from '@entities/translation';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {TranslationService} from "@app/common/services/translations.service";


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

    public firstLaunch: boolean;

    private handlingsTranslations: {[label: string]: string};

    private currentFilterSubject: string;

    public constructor(private mainHeaderService: MainHeaderService,
                       private sqliteService: SqliteService,
                       private translationService: TranslationService,
                       navService: NavService) {
        super(navService);
        this.selectedSubject$ = new Subject<string>();
        this.firstLaunch = true;
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;

        const withoutLoading = this.currentNavParams.get('withoutLoading');
        if (!this.firstLaunch || !withoutLoading) {
            zip(
                this.sqliteService.findAll('handling'),
                this.translationService.get('services')
            )
                .subscribe(([handlings, handlingsTranslations]: [Array<Handling>, Translations]) => {
                    this.handlingsTranslations = handlingsTranslations;
                    this.handlings = handlings

                    const initHandlingList = this.filterHandlingList(this.currentFilterSubject);

                    this.refreshHandlingListConfig(initHandlingList);
                    this.refreshSubTitle(initHandlingList);

                    this.hasLoaded = true;
                });
        }
        else {
            this.hasLoaded = true;
            this.firstLaunch = false;
        }
    }

    public onBarcodeScanned(barcode: string) {
        const filteredHandling = this.filterHandlingList(barcode);

        if (filteredHandling.length === 1) {
            this.onSearchCleared();
            this.navService.push(NavPathEnum.HANDLING_VALIDATE, {handling: filteredHandling[0]});
        }
        else {
            this.currentFilterSubject = barcode;
            this.selectedSubject$.next(barcode);
            this.refreshHandlingListConfig(filteredHandling);
            this.refreshSubTitle(filteredHandling);
        }
    }

    public onSearchCleared() {
        this.currentFilterSubject = undefined;
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
                    {label: TranslationService.Translate(this.handlingsTranslations, 'Objet'), value: handling.subject},
                    {label: TranslationService.Translate(this.handlingsTranslations, 'Nombre d\'opération(s) réalisée(s)'), value: `${handling.carriedOutOperationCount || ''}`},
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
                    this.navService.push(NavPathEnum.HANDLING_VALIDATE, {handling});
                }
            }));
    }

    public refreshSubTitle(handlings: Array<Handling>): void {
        const handlingsLength = handlings.length;
        this.mainHeaderService.emitSubTitle(`${handlingsLength === 0 ? 'Aucune' : handlingsLength} demande${handlingsLength > 1 ? 's' : ''}`)
    }

    public filterHandlingList(filter: string): Array<Handling> {
        return filter
            ? this.handlings.filter(({subject}) => (filter === subject))
            : this.handlings;
    }
}
