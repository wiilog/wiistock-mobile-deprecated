import {Component} from '@angular/core';
import {of, zip} from 'rxjs';
import {CardListColorEnum} from '@app/common/components/card-list/card-list-color.enum';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {DemandeLivraison} from '@entities/demande-livraison';
import {DemandeLivraisonType} from '@entities/demande-livraison-type';
import {CardListConfig} from '@app/common/components/card-list/card-list-config';
import {StorageService} from '@app/common/services/storage.service';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {NavService} from '@app/common/services/nav.service';
import {DemandeLivraisonHeaderPageRoutingModule} from '@pages/demande/demande-livraison/demande-livraison-header/demande-livraison-header-routing.module';
import {flatMap, map} from 'rxjs/operators';
import {DemandeLivraisonArticlesPageRoutingModule} from '@pages/demande/demande-livraison/demande-livraison-articles/demande-livraison-articles-routing.module';


@Component({
    selector: 'wii-demande-livraison-menu',
    templateUrl: './demande-livraison-menu.page.html',
    styleUrls: ['./demande-livraison-menu.page.scss'],
})
export class DemandeLivraisonMenuPage {
    public hasLoaded: boolean;

    public readonly demandeLivraisonListColor = CardListColorEnum.YELLOW;
    public readonly demandeLivraisonIconName = 'demande.svg';

    public demandesListConfig: Array<CardListConfig>;
    public demandesLivraison: Array<DemandeLivraison>;

    public fabListActivated: boolean;

    public constructor(private sqliteService: SqliteService,
                       private navService: NavService,
                       private mainHeaderService: MainHeaderService,
                       private storageService: StorageService) {
        this.hasLoaded = false;
        this.fabListActivated = false
    }

    public ionViewWillEnter(): void {
        this.fabListActivated = false
        this.hasLoaded = false;
        zip(
            this.sqliteService.findAll('`demande_livraison`'),
            this.sqliteService.findAll('`demande_livraison_type`'),
            this.storageService.getOperateur()
        )
            .pipe(
                flatMap(([demandesLivraison, types, operator]: [Array<DemandeLivraison>, Array<DemandeLivraisonType>, string]) => {
                    const locationIdsJoined = demandesLivraison
                        .map(({location_id}) => location_id)
                        .filter(Boolean)
                        .join(', ');
                    return (locationIdsJoined.length > 0
                        ? this.sqliteService.findBy('emplacement', [`id IN (${locationIdsJoined})`])
                        : of([]))
                            .pipe(
                                map((locations) => ([
                                    demandesLivraison,
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
                flatMap(([demandesLivraison, typesConverter, operator, locationsConverter]: [Array<DemandeLivraison>, {[id: number]: string}, string, {[id: number]: string}, {[id: number]: number}]) => {
                    return (demandesLivraison.length > 0
                        ? this.sqliteService.countArticlesByDemandeLivraison(demandesLivraison.map(({id}) => id))
                        : of({}))
                            .pipe(
                                map((counters) => ([
                                    demandesLivraison,
                                    typesConverter,
                                    operator,
                                    locationsConverter,
                                    counters
                                ]))
                            )
                })
            )
        .subscribe(([demandesLivraison, typesConverter, operator, locationsConverter, articlesCounters]: [Array<DemandeLivraison>, {[id: number]: string}, string, {[id: number]: string}, {[id: number]: number}]) => {
            this.demandesLivraison = demandesLivraison;
            this.demandesListConfig = this.demandesLivraison.map((demande: DemandeLivraison) => {
                const articlesCounter = articlesCounters[demande.id] || 0;
                const sArticle = articlesCounter > 1 ? 's' : '';
                return ({
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
                });
            });

            this.hasLoaded = true;
            this.refreshSubTitle();
        });
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
        // TODO
    }

    public onAddClick(): void {
        this.navService.push(DemandeLivraisonHeaderPageRoutingModule.PATH, {
            isCreation: true
        });
    }
}
