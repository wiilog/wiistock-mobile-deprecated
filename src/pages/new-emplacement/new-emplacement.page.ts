import {Component} from '@angular/core';
import {ApiService} from '@app/common/services/api.service';
import {ToastService} from '@app/common/services/toast.service';
import {LoadingService} from '@app/common/services/loading.service';
import {NavService} from '@app/common/services/nav.service';
import {flatMap, map} from 'rxjs/operators';
import {from} from 'rxjs';
import {PageComponent} from '@pages/page.component';

@Component({
    selector: 'wii-new-emplacement',
    templateUrl: './new-emplacement.page.html',
    styleUrls: ['./new-emplacement.page.scss'],
})
export class NewEmplacementPage extends PageComponent {

    public loading: boolean;

    public simpleFormConfig: { title: string; fields: Array<{label: string; name: string;}> };

    private createNewEmp: (emplacement) => void;
    private isDelivery: boolean;

    public constructor(private apiService: ApiService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       navService: NavService) {
        super(navService);
        this.loading = false;

        this.simpleFormConfig = {
            title: 'Nouvel emplacement',
            fields: [
                {
                    label: 'Label',
                    name: 'location'
                }
            ]
        }
    }

    public ionViewWillEnter(): void {
        const navParams = this.navService.getCurrentParams();
        this.createNewEmp = navParams.get('createNewEmp');
        this.isDelivery = navParams.get('isDelivery');
    }

    public onFormSubmit(data): void {
        if (!this.loading) {
            const {location} = data;
            if (location && location.length > 0) {
                this.loadingService
                    .presentLoading('Création de l\'emplacement')
                    .subscribe((loader: HTMLIonLoadingElement) => {
                        this.loading = true;
                        const params = {
                            label: location,
                            isDelivery: this.isDelivery ? '1' : '0'
                        };
                        this.apiService
                            .requestApi("post", ApiService.NEW_EMP, {params})
                            .pipe(
                                flatMap((response) => {
                                    this.loading = false;
                                    return from(loader.dismiss()).pipe(map(() => response));
                                }),
                                flatMap((response) => this.navService.pop().pipe(map(() => response)))
                            )
                            .subscribe(
                                (response) => {
                                    this.createNewEmp({
                                        id: Number(response.msg),
                                        label: location
                                    });
                                },
                                (response) => {
                                    this.loading = false;
                                    loader.dismiss();
                                    this.toastService.presentToast((response.error && response.error.msg) || 'Une erreur s\'est produite');
                                });

                        ///////////////////////////
                    });
            }
            else {
                this.toastService.presentToast('Vous devez saisir un emplacement valide.');
            }
        }
    }
}
