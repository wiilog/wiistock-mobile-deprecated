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
            .pipe(flatMap(([demandesLivraison, types, operator]: [Array<DemandeLivraison>, Array<DemandeLivraisonType>, string]) => {
                const locationIdsJoined = demandesLivraison
                    .map(({location_id}) => location_id)
                    .join(', ');
                return (locationIdsJoined.length > 0
                    ? this.sqliteService
                        .findBy('emplacements', [`WHERE id IN (${locationIdsJoined})`])
                        .pipe(
                            flatMap((locations) => (
                                locations.reduce((acc, {id, label}) => ({
                                    ...acc,
                                    [id]: label
                                }), {})
                            )),
                    )
                    : of({}))
                        .pipe(
                            map((locationsConverter) => ([
                                demandesLivraison,
                                types.reduce((acc, {id, label}) => ({
                                    ...acc,
                                    [id]: label
                                }), {}),
                                operator,
                                locationsConverter
                            ]))
                        )
            }))
        .subscribe(([demandesLivraison, types, operator, locationsConverter]: [Array<DemandeLivraison>, {[id: number]: string}, string, {[id: number]: string}]) => {
            this.demandesLivraison = demandesLivraison;
            this.demandesListConfig = this.demandesLivraison.map((demande: DemandeLivraison) => ({
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
                        value: types[demande.type_id] || ''
                    },
                    {
                        label: 'Commentaire',
                        value: demande.comment
                    }
                ],
                action: () => {
                    // this.navService.push(LivraisonArticlesPageRoutingModule.PATH, {livraison});
                }
            }));

            this.hasLoaded = true;
            this.refreshSubTitle();
        });
    }

    public refreshSubTitle(): void {
        const demandeLivraisonsLength = (this.demandesLivraison || []).length;
        this.mainHeaderService.emitSubTitle(`${demandeLivraisonsLength === 0 ? 'Aucune' : demandeLivraisonsLength} livraison${demandeLivraisonsLength > 1 ? 's' : ''}`)
    }

    public onMenuClick(): void {
        this.fabListActivated = !this.fabListActivated;
    }

    public onRefreshClick(): void {
        this.fabListActivated = false;
    }

    public onAddClick(): void {
        this.navService.push(DemandeLivraisonHeaderPageRoutingModule.PATH, {
            isCreation: true
        });
    }
}
