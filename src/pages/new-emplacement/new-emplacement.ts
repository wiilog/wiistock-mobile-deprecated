import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from "ionic-angular";
import {Emplacement} from "@app/entities/emplacement";
import {ApiService} from "@app/services/api.service";
import {ToastService} from "@app/services/toast.service";

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
    constructor(
        public navParams: NavParams,
        private apiService: ApiService,
        private toast: ToastService,
        private navCtrl: NavController) {
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
        this.apiService.requestApi("post", ApiService.NEW_EMP, {label: this.emplacement.label, isDelivery: this.fromDepose ? '1' : '0'}).subscribe(response => {
            if (response.success) {
                this.emplacement.id = Number(response.msg);
                this.createNewEmp(this.emplacement);
                this.navCtrl.pop();
            } else {
                this.toast.presentToast(response.msg);
            }
        });
    }

}
