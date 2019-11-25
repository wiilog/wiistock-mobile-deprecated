import {Component} from '@angular/core';
import {IonicPage, NavController} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {HttpClient} from '@angular/common/http';
import {ToastService} from '@app/services/toast.service';
import {ApiService} from '@app/services/api.service';
import {flatMap} from 'rxjs/operators';


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
                       private http: HttpClient,
                       private apiService: ApiService,
                       private toastService: ToastService) {
        this.URL = '';
        this.isLoading = true;
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
            this.apiService
                .getApiUrl(ApiService.GET_PING, this.URL)
                .pipe(
                    flatMap((pingURL: string) => this.http.get(pingURL)),
                    flatMap(() => this.sqliteProvider.setAPI_URL(this.URL)),
                    flatMap(() => this.toastService.showToast('URL enregistrée'))
                )
                .subscribe(
                    () => {
                        this.isLoading = false;
                        this.navCtrl.pop();
                    },
                    () => {
                        this.isLoading = false;
                        this.toastService.showToast('URL invalide')
                    }
                );
        }
    }
}
