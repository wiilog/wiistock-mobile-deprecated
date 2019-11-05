import {Injectable} from "@angular/core";
import {SqliteProvider} from "@providers/sqlite/sqlite";
import {ApiServices} from "@app/config/api-services";
import {Observable} from "rxjs";
import {flatMap, map} from "rxjs/operators";
import {HttpClient} from "@angular/common/http";
import {StorageService} from "@app/services/storage.service";


@Injectable()
export class LocalDataManagerService {

    public constructor(private sqliteProvider: SqliteProvider,
                       private storageService: StorageService,
                       private httpClient: HttpClient) {}

    /**
     * Disable autocapitalize on all input in all alert with CSS_CLASS_MANAGED_ALERT
     */
    public saveFinishPrepa(): void {
        this.sqliteProvider.getApiUrl(ApiServices.FINISH_PREPA).subscribe((finishPrepaUrl) => {
            this.storageService.getApiKey().subscribe((key) => {
                // TODO AB change zip pour rxjs
                Observable.zip(
                    this.sqliteProvider.findAll('`preparation`'),
                    this.sqliteProvider.findAll('`mouvement`')
                )
                    .pipe(
                        map(([preparations, mouvements]) => ([
                            preparations.filter(p => p.date_end !== null),
                            mouvements.filter(m => m.id_livraison === null)
                        ])),
                        map(([preparations, mouvements]) => {
                            const preparationsToSend = preparations
                                .filter(p => p.date_end !== null)
                                .map((preparation) => ({
                                    ...preparation,
                                    mouvements: mouvements.filter((mouvement) => mouvement.id_prepa === preparation.id)
                                }));

                            return [
                                finishPrepaUrl,
                                {
                                    preparations: preparationsToSend,
                                    apiKey: key
                                }
                            ];
                        }),
                        flatMap(([finishPrepaUrl, params]) => this.httpClient.post<any>(finishPrepaUrl, params))

                        ///  this.sqliteProvider.deletePreparations(params.preparations).then(() => {
                        //   this.sqliteProvider.deleteMvts(params.mouvements)
                    );
            });
        });
    }
}
