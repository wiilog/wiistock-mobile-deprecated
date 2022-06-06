import {Component, ViewChild} from '@angular/core';
import {PageComponent} from '@pages/page.component';
import {NavService} from '@app/common/services/nav/nav.service';
import {ApiService} from '@app/common/services/api.service';
import {LoadingService} from '@app/common/services/loading.service';
import {TransportRoundLine} from '@entities/transport-round-line';
import {
    FormPanelSelectComponent
} from '@app/common/components/panel/form-panel/form-panel-select/form-panel-select.component';
import {FormPanelParam} from '@app/common/directives/form-panel/form-panel-param';
import {FormViewerParam} from '@app/common/directives/form-viewer/form-viewer-param';
import {FormPanelComponent} from '@app/common/components/panel/form-panel/form-panel.component';
import {ToastService} from '@app/common/services/toast.service';
import {
    FormPanelCameraComponent
} from '@app/common/components/panel/form-panel/form-panel-camera/form-panel-camera.component';
import {
    FormPanelTextareaComponent
} from '@app/common/components/panel/form-panel/form-panel-textarea/form-panel-textarea.component';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {FileService} from '@app/common/services/file.service';
import {flatMap, map} from 'rxjs/operators';
import {TransportService} from '@app/common/services/transport.service';

@Component({
    selector: 'wii-transport-failure',
    templateUrl: './transport-failure.page.html',
    styleUrls: ['./transport-failure.page.scss'],
})
export class TransportFailurePage extends PageComponent {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public bodyConfig: Array<FormPanelParam>;
    public detailsConfig: Array<FormViewerParam>;
    public headerConfig: HeaderConfig;

    private deliveryRejectMotives: Array<any>;
    private collectRejectMotives: Array<any>;
    public transport: TransportRoundLine;

    constructor(private apiService: ApiService,
                private loadingService: LoadingService,
                private toastService: ToastService,
                private fileService: FileService,
                private transportService: TransportService,
                navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.loadingService.presentLoadingWhile({
            event: () => this.apiService.requestApi(ApiService.GET_REJECT_MOTIVES)
        }).subscribe(({delivery, collect}: { delivery: Array<string>; collect: Array<string> }) => {
            this.deliveryRejectMotives = delivery;
            this.collectRejectMotives = collect;
            this.transport = this.currentNavParams.get('transport');

            const motives = this.transport.kind === 'collect'
                ? this.collectRejectMotives
                : this.deliveryRejectMotives;

            const kind = this.transport.kind === 'collect' ? 'Collecte' : 'Livraison'
            this.headerConfig = {
                title: `${kind} impossible`,
                leftIcon: {
                    name: `canceled-${this.transport.kind}.svg`,
                }
            };

            this.bodyConfig = [
                {
                    item: FormPanelSelectComponent,
                    config: {
                        label: 'Motif',
                        name: 'motive',
                        inputConfig: {
                            required: true,
                            elements: motives.map((label) => ({id: label, label}))
                        },
                        errors: {
                            required: 'Vous devez sélectionner un motif'
                        }
                    },
                },
                {
                    item: FormPanelTextareaComponent,
                    config: {
                        label: `Commentaire`,
                        name: 'comment',
                        inputConfig: {
                            required: false,
                            maxLength: '512',
                        },
                        errors: {
                            required: 'Le commentaire est requis',
                        }
                    }
                },
                {
                    item: FormPanelCameraComponent,
                    config: {
                        label: 'Photo',
                        name: 'photo',
                        inputConfig: {
                            multiple: false
                        }
                    }
                },
            ];
        });
    }

    public onFormSubmit(): void {
        if (this.formPanelComponent.firstError) {
            this.toastService.presentToast(this.formPanelComponent.firstError);
        } else {
            const {motive, comment, photo} = this.formPanelComponent.values;

            const params = {
                transport: this.transport.id,
                round: this.transport.round.id,
                motive,
                comment,
                ...({
                    photo: (photo ? this.fileService.createFile(
                            photo,
                            FileService.SIGNATURE_IMAGE_EXTENSION,
                            FileService.SIGNATURE_IMAGE_TYPE,
                            'photo')
                        : undefined),
                }),
            };

            this.loadingService.presentLoadingWhile({
                event: () => this.apiService.requestApi(ApiService.TRANSPORT_FAILURE, {params})
                    .pipe(
                        flatMap((result) => this.apiService.requestApi(ApiService.FETCH_ROUND, {
                            params: {round: this.transport.round.id},
                        }).pipe(map((round) => [result, round]))),
                    )
            }).subscribe(([result, round]) => {
                this.transportService.treatTransport(this.transport, round);
                this.navService.runMultiplePop(2);
            });
        }
    }
}
