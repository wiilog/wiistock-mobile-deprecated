import {Injectable} from '@angular/core';
import {AlertManagerService} from "./alert-manager.service";
import {AlertController} from '@ionic/angular';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';
import * as moment from 'moment';
import {from} from 'rxjs';
import {MouvementTraca} from '@entities/mouvement-traca';
import {Emplacement} from '@entities/emplacement';

type ListConfig = {
    header: HeaderConfig;
    body: Array<ListPanelItemConfig>;
};

@Injectable({
    providedIn: 'root'
})
export class TrackingListFactoryService {

    public static readonly TRACKING_IDENTIFIER_NAME = 'object';

    public static readonly LIST_TYPE_TAKING_MAIN = 0;
    public static readonly LIST_TYPE_TAKING_SUB = 1;
    public static readonly LIST_TYPE_DROP_MAIN = 2;
    public static readonly LIST_TYPE_DROP_SUB = 3;
    private static readonly LIST_TYPE_CONFIG = {
        [TrackingListFactoryService.LIST_TYPE_TAKING_MAIN]: {
            title: 'PRISE',
            hasScanLabel: true,
            iconName: 'upload.svg',
            iconColor: 'primary'
        },
        [TrackingListFactoryService.LIST_TYPE_TAKING_SUB]: {
            title: 'ENCOURS',
            hasScanLabel: false,
            iconName: 'download.svg',
            iconColor: 'success'
        },
        [TrackingListFactoryService.LIST_TYPE_DROP_MAIN]: {
            title: 'DÉPOSE',
            hasScanLabel: true,
            iconName: 'download.svg',
            iconColor: 'success'
        },
        [TrackingListFactoryService.LIST_TYPE_DROP_SUB]: {
            title: 'PRISE',
            hasScanLabel: false,
            iconName: 'upload.svg',
            iconColor: 'primary'
        },
    };

    private _alertPresented: boolean;
    private actionsDisabled: boolean;

    public constructor(private alertController: AlertController) {
        this._alertPresented = false;
        this.actionsDisabled = true;
    }

    public static CreateRemoveItemFromListHandler(listSource: Array<MouvementTraca>,
                                                  listDest: Array<MouvementTraca & { hidden?: boolean }> | undefined,
                                                  refreshList: (value?: string) => void): (info: { object?: { value?: string } }) => void {
        return ({object: {value} = {value: undefined}}) => {
            const valueIndex = listSource.findIndex(({ref_article}) => (ref_article === value));
            if (valueIndex > -1) {
                if (listDest) {
                    const valueIndexInDest = listDest.findIndex(({ref_article}) => (ref_article === value));
                    if (valueIndexInDest > -1) {
                        listDest[valueIndexInDest].hidden = false;
                    } else {
                        listDest.push(listSource[valueIndex]);
                    }

                }
                listSource.splice(valueIndex, 1);
                refreshList(value);
            }
        }
    }

    public static GetObjectLabel(fromStock: boolean): string {
        return fromStock
            ? 'article'
            : 'objet';
    }

    private createConfirmationBoxAlert(message?: string, removeItem?: (info: { [name: string]: { value?: string } }) => void): void {
        if (!this.actionsDisabled && !this._alertPresented) {
            this._alertPresented = true;
            from(this.alertController.create({
                header: 'Confirmation',
                cssClass: AlertManagerService.CSS_CLASS_MANAGED_ALERT,
                message,
                buttons: [
                    {
                        text: 'Confirmer',
                        cssClass: 'alert-success',
                        handler: removeItem
                    },
                    {
                        text: 'Annuler',
                        cssClass: 'alert-danger',
                        role: 'cancel',
                        handler: () => {
                            this._alertPresented = false;
                            return null;
                        }
                    }
                ]
            })).subscribe((alert: HTMLIonAlertElement) => {
                alert.onDidDismiss().then(() => {
                    this._alertPresented = false;
                });
                if (this._alertPresented) {
                    alert.present();
                }
            });
        }
    }

    public createListConfig(articles: Array<MouvementTraca & {loading?: boolean; isGroup?: boolean; subPacks?: Array<MouvementTraca>;}>,
                            listType: number,
                            {location, objectLabel,  validate, rightIcon, confirmItem, natureIdsToConfig, natureTranslation}: {
                                location?: Emplacement;
                                natureIdsToConfig?: {[id: number]: { label: string; color?: string; }};
                                validate?: () => void;
                                rightIcon?: {
                                    mode: 'upload'|'remove';
                                    action: (info: { [name: string]: { label: string; value?: string; } }) => void;
                                };
                                confirmItem?: (info: { [name: string]: { label: string; value?: string; } }) => void;
                                objectLabel: string;
                                natureTranslation?: string;
                            }): ListConfig {

        const notDuplicateArticles = articles.reduce(
            (acc, movement) => {
                const alreadyIndex = acc.findIndex(({ref_article}) => (movement.ref_article === ref_article));
                if (alreadyIndex > -1) {
                    if (acc[alreadyIndex].fromStock) {
                        acc[alreadyIndex].quantity += movement.quantity;
                    }
                }
                else {
                    acc.push({...movement});
                }

                return acc;
            },
            []
        );

        const pickedArticlesNumber = notDuplicateArticles.length;
        const plural = pickedArticlesNumber > 1 ? 's' : '';

        const config = TrackingListFactoryService.LIST_TYPE_CONFIG[listType];

        if (!config) {
            throw new Error(`The parameter listType ${listType} is invalid`);
        }

        const {title, hasScanLabel, iconName, iconColor} = config;

        return {
            header: {
                title,
                subtitle: location ? `Emplacement : ${location.label}` : undefined,
                info: `${pickedArticlesNumber} ${objectLabel}${plural}` + (hasScanLabel ? ` scanné${plural}` : ''),
                leftIcon: {
                    name: iconName,
                    color: iconColor
                },
                ...(
                    validate
                        ? {
                            rightIcon: {
                                name: 'check.svg',
                                color: 'success',
                                action:  () => {
                                    if (!this._alertPresented && !this.actionsDisabled) {
                                        validate();
                                    }
                                }
                            }
                        }
                        : {}
                )
            },
            body: notDuplicateArticles.map(({date, ref_article, quantity, quantite, nature_id, loading, isGroup, subPacks}) => {
                const natureConfig = (natureIdsToConfig && nature_id && natureIdsToConfig[nature_id]);

                let quantityRow = {};
                if (!loading) {
                    quantityRow = isGroup
                        ? {
                            quantity: {
                                label: 'Nombre colis',
                                value: (subPacks || []).length
                            }
                        }
                        : ((quantity || quantite
                            ? {
                                quantity: {
                                    label: 'Quantité',
                                    value: String(quantity || quantite)
                                }
                            }
                            : {}));
                }


                const infos = {
                    [TrackingListFactoryService.TRACKING_IDENTIFIER_NAME]: {
                        label: 'Objet',
                        value: ref_article
                    },
                    ...quantityRow,
                    date: {
                        label: 'Date / Heure',
                        value: moment(date, moment.defaultFormat).format('DD/MM/YYYY HH:mm:ss')
                    },
                    ...(
                        natureConfig
                            ? {
                                nature: {
                                    label: natureTranslation,
                                    value: natureConfig.label
                                }
                            }
                            : {}),
                };
                return {
                    infos,
                    color: natureConfig && natureConfig.color,
                    pressAction: confirmItem
                        ? (info) => {
                            if (!this._alertPresented && !this.actionsDisabled) {
                                confirmItem(info);
                            }
                        }
                        : undefined,
                    loading,
                    ...(rightIcon
                        ? {
                            rightIcon: {
                                color: (
                                    rightIcon.mode === 'upload' ? 'medium'
                                    /* rightIcon.mode === 'remove' */ : 'danger'
                                ),
                                name: (
                                    rightIcon.mode === 'upload' ? 'up.svg'
                                    /* rightIcon.mode === 'remove' */ : 'trash.svg'
                                ),
                                action: rightIcon.action
                                    ? () => {
                                        if (!this.actionsDisabled) {
                                            if (rightIcon.mode === 'upload') {
                                                if (!this._alertPresented) {
                                                    rightIcon.action(infos);
                                                }
                                            }
                                            else { /* rightIcon.mode === 'remove' */
                                                this.createConfirmationBoxAlert('Êtes-vous sur de vouloir supprimer cet élément ?', () => rightIcon.action(infos));
                                            }
                                        }
                                    }
                                    : undefined
                            }
                        }
                        : {})
                };
            })
        }
    }

    public enableActions(): void {
        this.actionsDisabled = false;
    }

    public disableActions(): void {
        this.actionsDisabled = true;
    }

    public get alertPresented(): boolean {
        return this._alertPresented;
    }

}
