import {Component, ViewChild} from '@angular/core';
import {Handling} from '@entities/handling';
import {ToastService} from '@app/common/services/toast.service';
import {ApiService} from '@app/common/services/api.service';
import {Network} from '@ionic-native/network/ngx';
import {LoadingService} from '@app/common/services/loading.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {NavService} from '@app/common/services/nav.service';
import {from, Observable, of, Subscription} from 'rxjs';
import {PageComponent} from '@pages/page.component';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {FormPanelParam} from '@app/common/directives/form-panel/form-panel-param';
import {HandlingAttachment} from '@entities/handling-attachment';
import {FormPanelInputComponent} from '@app/common/components/panel/form-panel/form-panel-input/form-panel-input.component';
import {FormPanelCameraComponent} from '@app/common/components/panel/form-panel/form-panel-camera/form-panel-camera.component';
import {FormPanelSelectComponent} from '@app/common/components/panel/form-panel/form-panel-select/form-panel-select.component';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {Status} from '@entities/status';
import {FormPanelComponent} from '@app/common/components/panel/form-panel/form-panel.component';
import {FileService} from '@app/common/services/file.service';
import {flatMap, map, tap} from 'rxjs/operators';
import {FormAttachmentViewerComponent} from '@app/common/components/panel/form-panel/form-attachments-viewer/form-attachment-viewer.component';
import {FormViewerParam} from '@app/common/directives/form-viewer/form-viewer-param';


@Component({
    selector: 'wii-handling-validate',
    templateUrl: './handling-validate.page.html',
    styleUrls: ['./handling-validate.page.scss'],
})
export class HandlingValidatePage extends PageComponent {
    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public headerConfig: HeaderConfig;
    public bodyConfig: Array<FormPanelParam>;
    public detailsConfig: Array<FormViewerParam>;

    private handling: Handling;

    private loadingElement: HTMLIonLoadingElement;
    private apiSubscription: Subscription;
    private dataSubscription: Subscription;

    public constructor(private loadingService: LoadingService,
                       private network: Network,
                       private apiService: ApiService,
                       private toastService: ToastService,
                       private sqliteService: SqliteService,
                       private fileService: FileService,
                       navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.handling = this.currentNavParams.get('handling');

        this.dataSubscription = this.dismissLoading()
            .pipe(
                flatMap(() => this.loadingService.presentLoading('Sauvegarde de la demande de service...')),
                tap((loading) => {
                    this.loadingElement = loading;
                }),
                flatMap(() => this.sqliteService.findBy('handling_attachment', [`handlingId = ${this.handling.id}`]))
            )
            .subscribe((handlingAttachment: Array<HandlingAttachment>) => {
                this.dismissLoading();

                this.headerConfig = {
                    title: `Demande de service ${this.handling.number}`,
                    leftIcon: {
                        color: 'success',
                        name: 'people.svg'
                    },
                    subtitle: [
                        `Demandeur : ${this.handling.requester || ''}`,
                        `Date attendue : ${this.handling.desiredDate || ''}`,
                        `Objet : ${this.handling.subject || ''}`,
                        `Source : ${this.handling.source || ''}`,
                        `Destination : ${this.handling.destination || ''}`,
                        `Type : ${this.handling.typeLabel || ''}`
                    ]
                };

                this.detailsConfig = handlingAttachment.length > 0
                    ? [
                        {
                            item: FormAttachmentViewerComponent,
                            config: {
                                label: `Pièces jointes`,
                                values: handlingAttachment.map(({fileName, href}) => ({
                                    label: fileName,
                                    href
                                }))
                            }
                        }
                    ]
                    : [];

                this.bodyConfig = [
                    {
                        item: FormPanelSelectComponent,
                        config: {
                            label: 'Status',
                            name: 'statusId',
                            inputConfig: {
                                required: true,
                                searchType: SelectItemTypeEnum.STATUS,
                                requestParams: [
                                    `category = 'service'`,
                                    `typeId = ${this.handling.typeId}`
                                ]
                            }
                        }
                    },
                    {
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Commentaire',
                            name: 'comment',
                            inputConfig: {
                                type: 'text',
                                maxLength: '255',
                                required: true
                            },
                            errors: {
                                required: 'Votre commentaire est requis',
                                maxlength: 'Votre commentaire est trop long'
                            }
                        }
                    },
                    {
                        item: FormPanelCameraComponent,
                        config: {
                            label: 'Photo',
                            name: 'photo',
                            inputConfig: {}
                        }
                    },
                ];
            });
    }

    public ionViewWillLeave(): void {
        if (this.apiSubscription) {
            this.apiSubscription.unsubscribe();
            this.apiSubscription = undefined;
        }
    }

    public onFormSubmit(): void {
        if (this.network.type !== 'none') {
            if (this.formPanelComponent.firstError) {
                this.toastService.presentToast(this.formPanelComponent.firstError);
            }
            else {
                const {statusId, comment, photo} = this.formPanelComponent.values

                const params = {
                    id: this.handling.id,
                    statusId,
                    comment,
                    photo: photo
                        ? this.fileService.createFile(
                            photo,
                            FileService.SIGNATURE_IMAGE_EXTENSION,
                            FileService.SIGNATURE_IMAGE_TYPE,
                            'photo'
                        )
                        : undefined,
                };

                this.apiSubscription = this.dismissLoading()
                    .pipe(
                        flatMap(() => this.loadingService.presentLoading('Sauvegarde de la demande de service...')),
                        tap((loading: HTMLIonLoadingElement) => {
                            this.loadingElement = loading;
                        }),
                        flatMap(() => this.apiService.requestApi('post', ApiService.POST_HANDLING, {params})),
                        flatMap((res) => this.dismissLoading().pipe(map(() => res))),

                    )
                    .subscribe(
                        ({success, message}) => {
                            if (success) {
                                this.navService.pop();
                                this.toastService.presentToast("La demande de service a bien été traitée.");
                            }
                            else {
                                this.toastService.presentToast(message || "Une erreur s'est produite.");
                            }
                        },
                        () => {
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
}
