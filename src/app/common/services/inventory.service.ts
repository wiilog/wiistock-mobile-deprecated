import {Injectable} from "@angular/core";
import {Emplacement} from '@entities/emplacement';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {of, zip} from 'rxjs';
import {LoadingService} from '@app/common/services/loading.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {StorageService} from '@app/common/services/storage.service';
import {map} from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
})
export class InventoryService {

    public constructor(private mainHeaderService: MainHeaderService,
                       private loadingService: LoadingService,
                       private storageService: StorageService,
                       private sqliteService: SqliteService) {

    }


    public refreshSubTitle(locations: Array<Emplacement>, anomalyMode: boolean): void {
        const locationsLength = locations.length;
        this.mainHeaderService.emitSubTitle(
            locationsLength === 0
                ? (anomalyMode ? 'Toutes les anomalies ont été traitées' : 'Tous les inventaires sont à jour')
                : `${locationsLength} emplacement${locationsLength > 1 ? 's' : ''}`
        );
    }

    public getData(anomalyMode: boolean) {
        return zip(
            this.loadingService.presentLoading('Chargement...'),
            this.sqliteService.findAll(anomalyMode ? '`anomalie_inventaire`' : '`article_inventaire`'),
            anomalyMode ? of(false) : this.storageService.getInventoryManagerRight()
        )
            .pipe(
                map(([loader, articles, isInventoryManager]) => ({
                    loader,
                    locations: articles
                        .reduce((acc, {location}) => ([
                            ...acc,
                            ...(acc.findIndex(({label: locationAlreadySaved}) => (locationAlreadySaved === location)) === -1
                                ? [{label: location}]
                                : [])
                        ]), []),
                    isInventoryManager
                }))
            );
    }

}
