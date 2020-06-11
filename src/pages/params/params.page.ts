import {Component} from '@angular/core';
import {ApiService} from '@app/common/services/api.service';
import {LoadingService} from '@app/common/services/loading.service';
import {ToastService} from '@app/common/services/toast.service';
import {from, Subscription} from 'rxjs';
import {flatMap} from 'rxjs/operators';
import {StorageService} from '@app/common/services/storage.service';
import {NavService} from '@app/common/services/nav.service';
import {CanLeave} from '@app/guards/can-leave/can-leave';


@Component({
    selector: 'wii-params',
    templateUrl: './params.page.html',
    styleUrls: ['./params.page.scss'],
})
export class ParamsPage implements CanLeave {

    public URL: string;

    private isLoading: boolean;

    private serverUrlSubscription: Subscription;

    public constructor(private navService: NavService,
                       private storageService: StorageService,
                       private apiService: ApiService,
                       private loadingService: LoadingService,
                       private toastService: ToastService) {
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
                        return this.apiService.getApiUrl(ApiService.GET_PING, this.URL);
                    }),
                    flatMap((pingURL: string) => this.apiService.pingApi(pingURL)),
                    flatMap(() => this.storageService.setServerUrl(this.URL)),
                    flatMap(() => from(loadingComponent.dismiss())),
                    flatMap(() => this.toastService.presentToast('URL enregistrée')),

                )
                .subscribe(
                    () => {
                        this.isLoading = false;
                        this.navService.setRoot('login');
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