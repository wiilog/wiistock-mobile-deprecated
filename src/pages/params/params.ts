import {Component} from '@angular/core';
import {IonicPage, Loading, NavController} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ToastService} from '@app/services/toast.service';
import {ApiService} from '@app/services/api.service';
import {flatMap} from 'rxjs/operators';
import {LoadingService} from "@app/services/loading.service";
import {from} from "rxjs/observable/from";


@IonicPage()
@Component({
    selector: 'page-params',
    templateUrl: 'params.html',
})
export class ParamsPage {

    public URL: string;

    private isLoading: boolean;

    public constructor(private navCtrl: NavController,
                       private sqliteProvider: SqliteProvider,
                       private apiService: ApiService,
                       private loadingService: LoadingService,
                       private toastService: ToastService) {
        this.URL = '';
        this.isLoading = true;
    }

    public ionViewCanLeave(): boolean {
        return !this.isLoading;
    }

    public ionViewWillEnter(): void {
        this.sqliteProvider.getServerUrl().subscribe((baseUrl) => {
            this.URL = !baseUrl ? '' : baseUrl;
            this.isLoading = false;
        });
    }

    public registerURL(): void {
        if (!this.isLoading) {
            this.isLoading = true;
            let loadingComponent: Loading;
            this.loadingService
                .presentLoading('Vérification de l\'URL...')
                .pipe(
                    flatMap((loading) =>  {
                        loadingComponent = loading;
                        return this.apiService.getApiUrl(ApiService.GET_PING, this.URL);
                    }),
                    flatMap((pingURL: string) => this.apiService.pingApi(pingURL)),
                    flatMap(() => this.sqliteProvider.setAPI_URL(this.URL)),
                    flatMap(() => from(loadingComponent.dismiss())),
                    flatMap(() => this.toastService.presentToast('URL enregistrée')),

                )
                .subscribe(
                    () => {
                        this.isLoading = false;
                        this.navCtrl.pop();
                    },
                    () => {
                        from(loadingComponent.dismiss()).subscribe(() => {
                            this.isLoading = false;
                            this.toastService.presentToast('URL invalide');
                        });
                    }
                );
        }
    }
}
