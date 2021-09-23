import {Component, ViewChild} from '@angular/core';
import {IconConfig} from '@app/common/components/panel/model/icon-config';
import {ViewWillEnter, ViewWillLeave} from '@ionic/angular';
import {NavService} from '@app/common/services/nav/nav.service';
import {PageComponent} from '@pages/page.component';
import {Emplacement} from '@entities/emplacement';
import {FormPanelParam} from '@app/common/directives/form-panel/form-panel-param';
import {FormPanelInputComponent} from '@app/common/components/panel/form-panel/form-panel-input/form-panel-input.component';
import {ApiService} from '@app/common/services/api.service';
import {FormPanelComponent} from '@app/common/components/panel/form-panel/form-panel.component';
import {LoadingService} from '@app/common/services/loading.service';
import {Network} from '@ionic-native/network/ngx';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {ToastService} from '@app/common/services/toast.service';
import * as moment from 'moment';

@Component({
    selector: 'app-empty-round',
    templateUrl: './empty-round.page.html',
    styleUrls: ['./empty-round.page.scss'],
})
export class EmptyRoundPage extends PageComponent implements ViewWillEnter, ViewWillLeave {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public emptyRoundHeader: {
        title: string;
        subtitle?: string;
        rightIcon: IconConfig;
    };

    public formBodyConfig: Array<FormPanelParam>;

    public location: Emplacement;

    constructor(private nav: NavService,
                private api: ApiService,
                private loading: LoadingService,
                private network: Network,
                private localDataManager: LocalDataManagerService,
                private sqliteService: SqliteService,
                private toast: ToastService) {
        super(nav);
    }

    public ionViewWillEnter() {
        this.location = this.currentNavParams.get(`emplacement`);
        this.emptyRoundHeader = {
            title: 'Passage à vide sur',
            subtitle: this.location.label,
            rightIcon: {
                name: 'check.svg',
                color: 'success',
                action: () => {
                    this.validate()
                }
            },
        };

        this.formBodyConfig = [{
            item: FormPanelInputComponent,
            config: {
                label: 'Commentaire',
                name: 'comment',
                inputConfig: {
                    type: 'text',
                    disabled: false
                }
            }
        }];
    }

    ionViewWillLeave(): void {
    }

    public validate() {
        const values = this.formPanelComponent.values;
        const online = (this.network.type !== 'none');

        const options = {
            location: this.location.label,
            comment: values.comment,
            date: moment().format('DD/MM/YYYY HH:mm:ss')
        }

        this.loading
            .presentLoading(`${online ? 'Envoi' : 'Sauvegarde'} du mouvement de passage à vide`).subscribe((loader: HTMLIonLoadingElement) => {
            if(online) {
                this.api.requestApi(ApiService.POST_EMPTY_ROUND, {
                    params: options
                }).subscribe(() => {
                    loader.dismiss();
                    this.nav.pop().subscribe(() => this.nav.pop());
                }, () => {
                    loader.dismiss();
                    this.toast.presentToast('Une erreur est survenue lors de l\'envoi des données');
                });
            } else {
                this.sqliteService.insert('empty_round', options).subscribe(() => {
                    loader.dismiss();
                    this.nav.pop().subscribe(() => this.nav.pop());
                });
            }
        })
    }
}
