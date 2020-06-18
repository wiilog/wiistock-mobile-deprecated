import {Component} from '@angular/core';
import {from, Observable, of, zip} from 'rxjs';
import {CardListColorEnum} from '@app/common/components/card-list/card-list-color.enum';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {DemandeLivraison} from '@entities/demande-livraison';
import {DemandeLivraisonType} from '@entities/demande-livraison-type';
import {CardListConfig} from '@app/common/components/card-list/card-list-config';
import {StorageService} from '@app/common/services/storage.service';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {NavService} from '@app/common/services/nav.service';
import {DemandeLivraisonHeaderPageRoutingModule} from '@pages/demande/demande-livraison/demande-livraison-header/demande-livraison-header-routing.module';
import {flatMap, map, tap} from 'rxjs/operators';
import {DemandeLivraisonArticlesPageRoutingModule} from '@pages/demande/demande-livraison/demande-livraison-articles/demande-livraison-articles-routing.module';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {ToastService} from '@app/common/services/toast.service';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {LoadingService} from '@app/common/services/loading.service';


@Component({
    selector: 'wii-demande-livraison-menu',
    templateUrl: './demande-livraison-menu.page.html',
    styleUrls: ['./demande-livraison-menu.page.scss'],
})
export class DemandeLivraisonMenuPage implements CanLeave {
    public hasLoaded: boolean;

    public readonly demandeLivraisonListColor = CardListColorEnum.YELLOW;
    public readonly demandeLivraisonIconName = 'demande.svg';

    public demandesListConfig: Array<CardListConfig>;
    public demandesLivraison: Array<DemandeLivraison>;

    public fabListActivated: boolean;

    private apiSending: boolean;

    private readonly demandeLivraisonData: {
        typesConverter: {[id: number]: string};
        operator: string;
        locationsConverter: {[id: number]: string};
        articlesCounters: {[id: number]: number};
    };

    public constructor(private sqliteService: SqliteService,
                       private navService: NavService,
                       private mainHeaderService: MainHeaderService,
                       private localDataManager: LocalDataManagerService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private storageService: StorageService) {
        this.hasLoaded = false;
        this.fabListActivated = false
        this.apiSending = false;

        this.demandeLivraisonData = {
            typesConverter: {},
            operator: undefined,
            locationsConverter: {},
            articlesCounters: {}
        };
    }

    public ionViewWillEnter(): void {
        this.fabListActivated = false
        this.hasLoaded = false;
        this.storageService.getOperatorId()
            .pipe(
                flatMap((userId) => this.sqliteService.findBy('`demande_livraison`', [`user_id = ${userId}`])),
                flatMap((demandesLivraison: Array<DemandeLivraison>) => this.preloadData(demandesLivraison).pipe(map(() => demandesLivraison)))
            )
            .subscribe((demandesLivraison: Array<DemandeLivraison>) => {
                this.refreshPageList(demandesLivraison);
                this.hasLoaded = true;
            });
    }

    public wiiCanLeave(): boolean {
        return !this.apiSending;
    }

    public refreshSubTitle(): void {
        const demandeLivraisonsLength = (this.demandesLivraison || []).length;
        this.mainHeaderService.emitSubTitle(`${demandeLivraisonsLength === 0 ? 'Aucune' : demandeLivraisonsLength} demande${demandeLivraisonsLength > 1 ? 's' : ''}`)
    }

    public onMenuClick(): void {
        this.fabListActivated = !this.fabListActivated;
    }

    public onRefreshClick(): void {
        this.fabListActivated = false;
        this.apiSending = true;

        zip(
            this.loadingService.presentLoading(),
            this.localDataManager.sendDemandesLivraisons()
        )
            .pipe(
                flatMap(([loading, data]: [HTMLIonLoadingElement, {success: Array<number>, errors: Array<DemandeLivraison>}]) => (
                    (data.errors.length > 0
                        ? this.preloadData(data.errors)
                        : of(undefined)).pipe(map(() => ([loading, data])))
                ))
            )
            .subscribe(([loading, data]: [HTMLIonLoadingElement, {success: Array<number>, errors: Array<DemandeLivraison>}]) => {
                const nbSuccess = data.success.length;
                const sSuccess = nbSuccess > 1 ? 's' : '';

                const nbErrors = data.errors.length;
                const sErrors = nbErrors > 1 ? 's' : '';

                const messages = [
                    nbSuccess > 0 ? `${nbSuccess} demande${sSuccess} synchronisée${sSuccess}` : '',
                    nbErrors > 0 ? `${nbErrors} demande${sErrors} en erreur` : ''
                ]
                    .filter(Boolean)
                    .join(', ');


                this.refreshPageList(data.errors);
                this.apiSending = false;
                from(loading.dismiss()).subscribe(() => {
                    this.toastService.presentToast(messages);
                });
            });
    }

    public onAddClick(): void {
        this.navService.push(DemandeLivraisonHeaderPageRoutingModule.PATH, {
            isCreation: true
        });
    }

    private refreshPageList(demandesLivraison: Array<DemandeLivraison>) {
        const {articlesCounters, operator, locationsConverter, typesConverter} = this.demandeLivraisonData;

        this.demandesLivraison = demandesLivraison;


        console.log(this.demandesLivraison, '---------------', this.demandeLivraisonData)
        this.demandesListConfig = this.demandesLivraison.map((demande: DemandeLivraison): CardListConfig => {
            const articlesCounter = articlesCounters[demande.id] || 0;
            const sArticle = articlesCounter > 1 ? 's' : '';
            return {
                title: {
                    label: 'Demandeur',
                    value: operator
                },
                content: [
                    {
                        label: 'Emplacement',
                        value: locationsConverter[demande.location_id] || ''
                    },
                    {
                        label: 'Type',
                        value: typesConverter[demande.type_id] || ''
                    },
                    {
                        label: 'Commentaire',
                        value: demande.comment
                    }
                ],
                info: `Non synchronisée, ${articlesCounter} article${sArticle} scanné${sArticle}`,
                error: demande.last_error,
                action: () => {
                    this.navService
                        .push(DemandeLivraisonHeaderPageRoutingModule.PATH, {
                            demandeId: demande.id,
                            isUpdate: true
                        })
                        .subscribe(() => {
                            this.navService.push(DemandeLivraisonArticlesPageRoutingModule.PATH, {
                                demandeId: demande.id,
                                isUpdate: true
                            });
                        });
                }
            };
        });

        this.refreshSubTitle();
    }

    public preloadData(demandesLivraison: Array<DemandeLivraison>): Observable<[{[id: number]: string}, string, {[id: number]: string}, {[id: number]: number}]> {
        return zip(
            this.sqliteService.findAll('`demande_livraison_type`'),
            this.storageService.getOperator()
        )
            .pipe(
                flatMap(([types, operator]: [Array<DemandeLivraisonType>, string]) => {
                    const locationIdsJoined = demandesLivraison
                        .map(({location_id}) => location_id)
                        .filter(Boolean)
                        .join(', ');
                    return (locationIdsJoined.length > 0
                        ? this.sqliteService.findBy('emplacement', [`id IN (${locationIdsJoined})`])
                        : of([]))
                        .pipe(
                            map((locations) => ([
                                types.reduce((acc, {id, label}) => ({
                                    ...acc,
                                    [id]: label
                                }), {}),
                                operator,
                                locations.reduce((acc, {id, label}) => ({
                                    ...acc,
                                    [id]: label
                                }), {})
                            ]))
                        )
                }),
                flatMap(([typesConverter, operator, locationsConverter]: [{[id: number]: string}, string, {[id: number]: string}, {[id: number]: number}]) => {
                    return (demandesLivraison.length > 0
                        ? this.sqliteService.countArticlesByDemandeLivraison(demandesLivraison.map(({id}) => id))
                        : of({}))
                        .pipe(
                            map((counters) => ([
                                typesConverter,
                                operator,
                                locationsConverter,
                                counters
                            ]))
                        )
                }),
                tap(([typesConverter, operator, locationsConverter, articlesCounters]: [{[id: number]: string}, string, {[id: number]: string}, {[id: number]: number}]) => {
                    this.demandeLivraisonData.typesConverter = typesConverter;
                    this.demandeLivraisonData.operator = operator;
                    this.demandeLivraisonData.locationsConverter = locationsConverter;
                    this.demandeLivraisonData.articlesCounters = articlesCounters;
                })
            );
    }
}
