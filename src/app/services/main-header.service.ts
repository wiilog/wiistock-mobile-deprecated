import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {TitleConfig} from '@helpers/components/main-header/title-config';
import {MainMenuPage} from '@pages/main-menu/main-menu';
import {PriseDeposeMenuPage} from '@pages/prise-depose/prise-depose-menu/prise-depose-menu';
import {EmplacementScanPage} from '@pages/prise-depose/emplacement-scan/emplacement-scan';
import {PreparationMenuPage} from "@pages/stock/preparation/preparation-menu/preparation-menu";
import {LivraisonMenuPage} from "@pages/stock/livraison/livraison-menu/livraison-menu";
import {CollecteMenuPage} from "@pages/stock/collecte/collecte-menu/collecte-menu";
import {InventaireMenuPage} from "@pages/stock/inventaire-menu/inventaire-menu";
import {ManutentionMenuPage} from "@pages/manutention/manutention-menu/manutention-menu";
import {ManutentionValidatePage} from "@pages/manutention/manutention-validate/manutention-validate";


@Injectable()
export class MainHeaderService {
    private readonly titleConfig: Array<TitleConfig<any>>;

    private readonly _navigationChange$: Subject<any>;

    public constructor() {
        this._navigationChange$ = new Subject<any>();

        this.titleConfig = [
            {
                page: MainMenuPage,
                name: 'Menu'
            },
            {
                page: PriseDeposeMenuPage,
                name: 'Traçabilité',
                filter: (instance) => (
                    (typeof instance.fromStock === 'boolean') &&
                    !instance.fromStock
                )
            },
            {
                page: PriseDeposeMenuPage,
                name: 'Transfert',
                filter: (instance) => (
                    (typeof instance.fromStock === 'boolean') &&
                    instance.fromStock
                )
            },
            {
                page: EmplacementScanPage,
                name: 'Prise',
                filter: (instance) => (
                    (typeof instance.fromDepose === 'boolean') &&
                    !instance.fromDepose
                )
            },
            {
                page: EmplacementScanPage,
                name: 'Dépose',
                filter: (instance) => (
                    (typeof instance.fromDepose === 'boolean') &&
                    instance.fromDepose
                )
            },
            {
                page: PreparationMenuPage,
                name: 'Préparation'
            },
            {
                page: LivraisonMenuPage,
                name: 'Livraison'
            },
            {
                page: CollecteMenuPage,
                name: 'Collecte'
            },
            {
                page: InventaireMenuPage,
                name: 'Inventaire'
            },
            {
                page: ManutentionMenuPage,
                name: 'Demande'
            },
            {
                page: ManutentionValidatePage,
                name: 'Détails'
            }
        ];
    }

    public emitNavigationChange() {
        this._navigationChange$.next(undefined);
    }

    public get navigationChange$(): Observable<any> {
        return this._navigationChange$;
    }

    public matchTitleConfig(name: string, instance: any): Array<TitleConfig<any>> {
        return this.titleConfig.filter(({page, filter}) => (
            (page.name === name) &&
            (
                !filter ||
                (instance && filter(instance))
            )
        ));
    }

    public findIndexTitleConfig({name: nameToCheck}: TitleConfig<any>, currentTitles: Array<TitleConfig<any>>): number {
        return currentTitles.findIndex(({name}) => (nameToCheck === name));
    }
}
