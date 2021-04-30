import {Component} from '@angular/core';
import {ApiService} from '@app/common/services/api.service';
import {LoadingService} from '@app/common/services/loading.service';
import {ToastService} from '@app/common/services/toast.service';
import {from, Subscription} from 'rxjs';
import {flatMap} from 'rxjs/operators';
import {StorageService} from '@app/common/services/storage/storage.service';
import {NavService} from '@app/common/services/nav.service';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {PageComponent} from '@pages/page.component';
import {SqliteService} from "@app/common/services/sqlite/sqlite.service";
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';


@Component({
    selector: 'wii-params',
    templateUrl: './params.page.html',
    styleUrls: ['./params.page.scss'],
})
export class ParamsPage extends PageComponent implements CanLeave {

    public URL: string;

    private isLoading: boolean;

    private serverUrlSubscription: Subscription;

    public constructor(private storageService: StorageService,
                       private apiService: ApiService,
                       private loadingService: LoadingService,
                       private sqliteService: SqliteService,
                       private toastService: ToastService,
                       navService: NavService) {
        super(navService);
        this.URL = '';
        this.isLoading = true;
    }

    public wiiCanLeave(): boolean {
        return !this.isLoading;
    }

    public ionViewWillEnter(): void {
        this.serverUrlSubscription = this.storageService.getServerUrl().subscribe((baseUrl) => {
            this.URL = !baseUrl ? '' : baseUrl;
            this.isLoading = false;
        });
    }

    public ionViewWillLeave(): void {
        if (this.serverUrlSubscription) {
            this.serverUrlSubscription.unsubscribe();
            this.serverUrlSubscription = undefined;
        }
    }

    public registerURL(): void {
        if (!this.isLoading) {
            this.isLoading = true;
            let loadingComponent: HTMLIonLoadingElement;
            this.loadingService
                .presentLoading('Vérification de l\'URL...')
                .pipe(
                    flatMap((loading) =>  {
                        loadingComponent = loading;
                        return this.apiService.getApiUrl(ApiService.GET_PING, {newUrl: this.URL});
                    }),
                    flatMap((pingURL: string) => this.apiService.pingApi(pingURL)),
                    flatMap(() => this.storageService.setServerUrl(this.URL)),
                    flatMap(() => this.sqliteService.resetDataBase(true)),
                    flatMap(() => from(loadingComponent.dismiss())),
                    flatMap(() => this.toastService.presentToast('URL enregistrée')),

                )
                .subscribe(
                    () => {
                        this.isLoading = false;
                        this.navService.setRoot(NavPathEnum.LOGIN);
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
