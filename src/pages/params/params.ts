import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {HttpClient} from '@angular/common/http';
import {ToastService} from '@app/services/toast.service';
import {ApiServices} from "@app/config/api-services";


@IonicPage()
@Component({
    selector: 'page-params',
    templateUrl: 'params.html',
})
export class ParamsPage {

    public URL: string;

    private isLoading: boolean;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public sqLiteProvider: SqliteProvider,
                       public http: HttpClient,
                       private toastService: ToastService) {
        this.URL = '';
        this.isLoading = true;
    }

    public ionViewWillEnter(): void {
        this.sqLiteProvider.getServerUrl().subscribe((baseUrl) => {
            this.URL = !baseUrl ? '' : baseUrl;
            this.isLoading = false;
        });
    }

    public registerURL(): void {
        if (!this.isLoading) {
            this.sqLiteProvider.setAPI_URL(this.URL).subscribe((result) => {
                if (result === true) {
                    this.toastService.showToast('URL enregistrée!');
                }
                else {
                    console.log(result);
                }
            });
        }
    }

    public testURL(): void {
        let url: string = `${this.URL}/api${ApiServices.GET_PING}`;
        this.http.post<any>(url, {}).subscribe(
            _ => {
                this.registerURL();
                this.toastService.showToast('URL valide.').subscribe(() => {
                    this.navCtrl.pop();
                });
            },
            _ => this.toastService.showToast('URL non valide.')
        );
    }
}
