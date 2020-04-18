import {Component} from '@angular/core';
import {IonicPage, Loading, NavController, NavParams} from "ionic-angular";
import {ApiService} from "@app/services/api.service";
import {ToastService} from "@app/services/toast.service";
import {LoadingService} from "@app/services/loading.service";

/**
 * Generated class for the NewEmplacementComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@IonicPage()
@Component({
    selector: 'new-emplacement',
    templateUrl: 'new-emplacement.html'
})
export class NewEmplacementComponent {

    public loading: boolean;

    public simpleFormConfig: { title: string; fields: Array<{label: string; name: string;}> };

    private createNewEmp: (emplacement) => void;
    private isDelivery: boolean;

    public constructor(private navParams: NavParams,
                       private apiService: ApiService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private navCtrl: NavController) {
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
        this.createNewEmp = this.navParams.get('createNewEmp');
        this.isDelivery = this.navParams.get('isDelivery');
    }

    public onFormSubmit(data): void {
        if (!this.loading) {
            const {location} = data;
            if (location && location.length > 0) {
                this.loadingService.presentLoading('Création de l\'emplacement').subscribe((loader: Loading) => {
                    this.loading = true;
                    const params = {
                        label: location,
                        isDelivery: this.isDelivery ? '1' : '0'
                    };
                    this.apiService.requestApi("post", ApiService.NEW_EMP, {params}).subscribe(
                        (response) => {
                            this.loading = false;
                            loader.dismiss();
                            this.navCtrl.pop().then(() => {
                                this.createNewEmp({
                                    id: Number(response.msg),
                                    label: location
                                });
                            });
                        },
                        (response) => {
                            this.loading = false;
                            loader.dismiss();
                            this.toastService.presentToast(response.error.msg);
                        });
                });
            }
            else {
                this.toastService.presentToast('Vous devez saisir un emplacement valide.');
            }
        }
    }
}
