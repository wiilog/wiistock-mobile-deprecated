import {Component, ViewChild} from '@angular/core';
import {PageComponent} from '@pages/page.component';
import {ViewWillEnter} from '@ionic/angular';
import {NavService} from '@app/common/services/nav/nav.service';
import {FormPanelComponent} from '@app/common/components/panel/form-panel/form-panel.component';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {FormPanelParam} from '@app/common/directives/form-panel/form-panel-param';
import {FormViewerParam} from '@app/common/directives/form-viewer/form-viewer-param';
import {TransportRoundLine} from '@entities/transport-round-line';
import {FormPanelInputComponent} from '@app/common/components/panel/form-panel/form-panel-input/form-panel-input.component';
import {FormPanelSigningComponent} from '@app/common/components/panel/form-panel/form-panel-signing/form-panel-signing.component';
import {FormPanelCameraComponent} from '@app/common/components/panel/form-panel/form-panel-camera/form-panel-camera.component';
import {FormViewerTableComponent} from '@app/common/components/panel/form-panel/form-viewer-table/form-viewer-table.component';
import {flatMap, map, tap} from 'rxjs/operators';
import {ApiService} from '@app/common/services/api.service';
import {from, Observable, of, Subscription} from 'rxjs';
import {NetworkService} from '@app/common/services/network.service';
import {ToastService} from '@app/common/services/toast.service';
import {LoadingService} from '@app/common/services/loading.service';
import {NatureWithQuantity} from '@app/common/components/panel/model/form-viewer/form-viewer-table-config';

@Component({
    selector: 'wii-finish-transport',
    templateUrl: './finish-transport.page.html',
    styleUrls: ['./finish-transport.page.scss'],
})
export class FinishTransportPage extends PageComponent implements ViewWillEnter {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public headerConfig: HeaderConfig;
    public bodyConfig: Array<FormPanelParam>;
    public detailsConfig: Array<FormViewerParam>;

    private loadingElement: HTMLIonLoadingElement;
    private apiSubscription: Subscription;

    public transport: TransportRoundLine;

    public constructor(private networkService: NetworkService, private toastService: ToastService,
                       private loadingService: LoadingService, private apiService: ApiService, navService: NavService) {
        super(navService);

        //TODO: Uncomment when the whole process is ready
        //this.transport = this.currentNavParams.get('transport');

        //TODO: Remove when the whole process is ready
        this.transport = {
            id: 50,
            number: '546875-01',
            type: `Chimio`,
            status: `En attente livreur`,
            kind: `delivery`,
            packs: [
                {number: `20220510-011000`, nature: `Oke`, temperature_range: `9°-20°C`, color: `#C5FFA3`},
                {number: `20220510-011011`, nature: `Na`, temperature_range: `47°-50°C`, color: `#245f79`},
                {number: `20220510-011012`, nature: `Na`, temperature_range: `47°-50°C`, color: `#245f79`},
                {number: `20220510-011013`, nature: `Na`, temperature_range: `47°-50°C`, color: `#245f79`},
                {number: `20220510-011014`, nature: `Na`, temperature_range: `47°-50°C`, color: `#245f79`},
                {number: `20220510-011021`, nature: `Ture`, temperature_range: `7°-11°C`, color: `#f6205a`},
            ],
            expected_at: `05/20/2021 20:22`,
            estimated_time: `20:22`,
            time_slot: `Après-midi`,
            contact: {
                file_number: `68465132`,
                address: `13 rue du 8 mai 1945\n33150 Cenon`,
                contact: `Jean-Pierre Dupont`,
                person_to_contact: `Sa Majesté`,
                observation: `Livraison à domicile`,
            },
            comment: null,
            photos: [],
            signature: null,
            requester: `Jade Léonnec`,
            free_fields: [
                {label: `COVID`, value: `Oui`, id: 5},
            ],
            priority: 1,
        };
    }

    public ionViewWillEnter() {
        this.transport.contact.address = this.transport.contact.address.replace(/\n/g, '<br/>');
        this.headerConfig = {
            title: `Objets ${this.transport.kind === `delivery` ? `déposés` : `collectés`}`,
            subtitle: [`${this.transport.packs.length} ${this.transport.kind === `delivery` ? `colis` : `objets`}`],
            leftIcon: {
                name: 'scanned-pack.svg'
            }
        };

        this.bodyConfig = [{
            item: FormPanelInputComponent,
            config: {
                label: `Commentaire`,
                name: 'comment',
                value: this.transport.comment,
                inputConfig: {
                    type: 'text',
                    maxLength: '512',
                },
                errors: {
                    required: 'Votre commentaire est requis',
                    maxlength: 'Votre commentaire est trop long'
                }
            }
        }, {
            item: FormPanelCameraComponent,
            config: {
                label: 'Photo',
                name: 'photo',
                value: null,
                inputConfig: {}
            }
        }, {
            item: FormPanelSigningComponent,
            config: {
                label: 'Signature',
                name: 'signature',
                value: null,
                inputConfig: {}
            }
        }];

        const natures: {[name: string]: NatureWithQuantity} = {};
        for(const pack of this.transport.packs) {
            if(!natures[pack.nature]) {
                natures[pack.nature] = {
                    color: pack.color,
                    title: pack.nature,
                    label: `Quantité`,
                    value: 0,
                }
            }

            natures[pack.nature].value = natures[pack.nature].value as number + 1;
        }

        this.detailsConfig = [{
            item: FormViewerTableComponent,
            config: {
                label: ``,
                value: Object.values(natures),
            }
        }];
    }

    public onFormSubmit() {
        if (this.networkService.hasNetwork()) {
            if (this.formPanelComponent.firstError) {
                this.toastService.presentToast(this.formPanelComponent.firstError);
            }
            else if (!this.apiSubscription) {
                console.log(this.formPanelComponent.values);

                const params = {
                    id: this.transport.id,
                    ...this.formPanelComponent.values,
                };

                this.apiSubscription = this.dismissLoading()
                    .pipe(
                        flatMap(() => this.loadingService.presentLoading(`Sauvegarde des données`)),
                        tap((loading: HTMLIonLoadingElement) => {
                            this.loadingElement = loading;
                        }),
                        flatMap(() => this.apiService.requestApi(ApiService.FINISH_TRANSPORT, {params})),
                        flatMap((res) => this.dismissLoading().pipe(map(() => res))),
                    )
                    .subscribe(
                        ({success, message}) => {
                            this.unsubscribeApi();
                            if (success) {
                                this.toastService.presentToast("Les données ont été sauvegardées");
                                //TODO: Rediriger au bon endroit
                            }
                            else {
                                this.toastService.presentToast(message || "Une erreur s'est produite.");
                            }
                        },
                        () => {
                            this.unsubscribeApi();
                            this.dismissLoading();
                            this.toastService.presentToast("Une erreur s'est produite.");
                        }
                    );
            }
        }
        else {
            this.toastService.presentToast('Vous devez être connecté à internet pour valider la demande.');
        }
    }

    public dismissLoading(): Observable<void> {
        return this.loadingElement
            ? from(this.loadingElement.dismiss()).pipe(tap(() => {
                this.loadingElement = undefined;
            }))
            : of(undefined);
    }

    private unsubscribeApi(): void {
        if (this.apiSubscription) {
            this.apiSubscription.unsubscribe();
            this.apiSubscription = undefined;
        }
    }

}