import {Component} from '@angular/core';
import {IonicPage, Loading, NavController, NavParams} from "ionic-angular";
import {Emplacement} from "@app/entities/emplacement";
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

    private createNewEmp: (emplacement) => void;
    private fromDepose: boolean;
    private emplacement: Emplacement;
    public menu: string;

    public loading: boolean;

    constructor(
        public navParams: NavParams,
        private apiService: ApiService,
        private toast: ToastService,
        private loadingService: LoadingService,
        private navCtrl: NavController) {
        this.loading = false;
    }

    ionViewWillEnter() {
        this.createNewEmp = this.navParams.get('createNewEmp');
        this.fromDepose = this.navParams.get('fromDepose');
        this.menu = this.navParams.get('menu');
        this.emplacement = {
            id: null,
            label: ''
        };
    }

    createEmp() {
        if (!this.loading) {
            this.loadingService.presentLoading('Création de l\'emplacement').subscribe((loader: Loading) => {
                this.loading = true;
                const serviceParams = {
                    label: this.emplacement.label,
                    isDelivery: this.fromDepose ? '1' : '0'
                };
                this.apiService.requestApi("post", ApiService.NEW_EMP, serviceParams).subscribe(
                    (response) => {
                        this.loading = false;
                        loader.dismiss();
                        this.emplacement.id = Number(response.msg);
                        this.createNewEmp(this.emplacement);
                        this.navCtrl.pop();
                    },
                    (response) => {
                        this.loading = false;
                        loader.dismiss();
                        this.toast.presentToast(response.msg);
                    });
            });
        }
    }

}
