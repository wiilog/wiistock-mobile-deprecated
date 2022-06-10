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
import {FileService} from "@app/common/services/file.service";
import {PackCountComponent} from '@app/common/components/pack-count/pack-count.component';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {TransportCardMode} from '@app/common/components/transport-card/transport-card.component';
import {TransportService} from '@app/common/services/transport.service';
import {TransportRound} from "@entities/transport-round";

@Component({
    selector: 'wii-finish-transport',
    templateUrl: './finish-transport.page.html',
    styleUrls: ['./finish-transport.page.scss'],
})
export class FinishTransportPage extends PageComponent implements ViewWillEnter {

    @ViewChild('packCount', {static: false})
    public packCount: PackCountComponent;

    public bodyConfig: Array<FormPanelParam>;

    private loadingElement: HTMLIonLoadingElement;
    private apiSubscription: Subscription;

    public transport: TransportRoundLine;
    public round: TransportRound;
    public edit: boolean = false;

    public constructor(private networkService: NetworkService, private toastService: ToastService,
                       private loadingService: LoadingService, private apiService: ApiService, navService: NavService,
                       private transportService: TransportService, private fileService: FileService) {
        super(navService);
    }

    public ionViewWillEnter() {
        this.transport = this.currentNavParams.get('transport');
        this.round = this.currentNavParams.get('round');
        this.edit = this.currentNavParams.get('edit');

        this.bodyConfig = [{
            item: FormPanelInputComponent,
            config: {
                label: `Commentaire`,
                name: 'comment',
                value: this.transport.comment ?? ``,
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
    }

    public onFormSubmit() {
        if (this.networkService.hasNetwork()) {
            if (this.packCount.formPanelComponent.firstError) {
                this.toastService.presentToast(this.packCount.formPanelComponent.firstError);
            }
            else if (!this.apiSubscription) {
                let {comment, photo, signature} = this.packCount.formPanelComponent.values;

                this.transport.comment = comment;

                const params = {
                    id: this.transport.id,
                    ...(comment ? {comment} : {}),
                    ...(this.transport.natures_to_collect ? {collectedPacks: JSON.stringify(this.transport.natures_to_collect)} : {}),
                    ...(photo ? {
                        photo: this.fileService.createFile(
                            photo,
                            FileService.SIGNATURE_IMAGE_EXTENSION,
                            FileService.SIGNATURE_IMAGE_TYPE,
                            "photo"
                        )
                    } : {}),
                    ...(signature ? {
                        signature: this.fileService.createFile(
                            signature,
                            FileService.SIGNATURE_IMAGE_EXTENSION,
                            FileService.SIGNATURE_IMAGE_TYPE,
                            "signature"
                        )
                    } : {}),
                };

                this.apiSubscription = this.dismissLoading()
                    .pipe(
                        flatMap(() => this.loadingService.presentLoading(`Sauvegarde des données`)),
                        tap((loading: HTMLIonLoadingElement) => {
                            this.loadingElement = loading;
                        }),
                        flatMap(() => this.apiService.requestApi(ApiService.FINISH_TRANSPORT, {params})),
                        flatMap((result) => this.apiService.requestApi(ApiService.FETCH_ROUND, {
                            params: {round: this.round.id},
                        }).pipe(map((round) => [result, round]))),
                        flatMap((res) => this.dismissLoading().pipe(map(() => res))),
                    )
                    .subscribe(
                        async ([{success, message}, round]) => {
                            this.transportService.treatTransport(this.round, round);

                            this.unsubscribeApi();
                            if (success) {
                                const allTransportsTreated = this.round.lines.every(({failure, success}) => failure || success);
                                this.toastService.presentToast("Les données ont été sauvegardées");

                                if(!this.edit && this.transport.collect) {
                                    await this.navService.runMultiplePop(allTransportsTreated ? 4 : 3);

                                    this.navService.push(NavPathEnum.TRANSPORT_SHOW, {
                                        transport: this.transport.collect,
                                        round: this.round,
                                        mode: TransportCardMode.STARTABLE,
                                    })
                                } else {
                                    const additionalPop = allTransportsTreated ? 1 : 0;
                                    await this.navService.runMultiplePop(this.edit ? (1 + additionalPop) : (3 + additionalPop));
                                }
                            }
                            else {
                                this.toastService.presentToast(message || "Une erreur s'est produite.");
                            }
                        },
                        (a) => {
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
