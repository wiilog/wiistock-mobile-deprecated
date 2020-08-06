import {Injectable} from '@angular/core';
import {AlertManagerService} from "./alert-manager.service";
import {AlertController} from '@ionic/angular';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';
import * as moment from 'moment';
import {IconColor} from '@app/common/components/icon/icon-color';
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
export class TracaListFactoryService {

    public static readonly LIST_TYPE_TAKING_MAIN = 0;
    public static readonly LIST_TYPE_TAKING_SUB = 1;
    public static readonly LIST_TYPE_DROP_MAIN = 2;
    public static readonly LIST_TYPE_DROP_SUB = 3;
    private static readonly LIST_TYPE_CONFIG = {
        [TracaListFactoryService.LIST_TYPE_TAKING_MAIN]: {
            title: 'PRISE',
            hasScanLabel: true,
            iconName: 'upload.svg',
            iconColor: 'primary'
        },
        [TracaListFactoryService.LIST_TYPE_TAKING_SUB]: {
            title: 'ENCOURS',
            hasScanLabel: false,
            iconName: 'download.svg',
            iconColor: 'success'
        },
        [TracaListFactoryService.LIST_TYPE_DROP_MAIN]: {
            title: 'DÉPOSE',
            hasScanLabel: true,
            iconName: 'download.svg',
            iconColor: 'success'
        },
        [TracaListFactoryService.LIST_TYPE_DROP_SUB]: {
            title: 'PRISE',
            hasScanLabel: false,
            iconName: 'upload.svg',
            iconColor: 'primary'
        },
    };

    private alertPresented: boolean;

    public constructor(private alertController: AlertController) {
        this.alertPresented = false;
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
        if (!this.alertPresented) {
            this.alertPresented = true;
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
                            this.alertPresented = false;
                            return null;
                        }
                    }
                ]
            })).subscribe((alert: HTMLIonAlertElement) => {
                alert.onDidDismiss().then(() => {
                    this.alertPresented = false;
                });
                alert.present();
            });
        }
    }

    public createListConfig(articles: Array<MouvementTraca>,
                            listType: number,
                            {location, objectLabel,  validate, uploadItem, confirmItem, removeItem, removeConfirmationMessage, natureIdsToConfig}: {
                                location?: Emplacement;
                                natureIdsToConfig?: {[id: number]: { label: string; color?: string; }};
                                validate?: () => void;
                                uploadItem?: (info: { object: { value?: string } }) => void;
                                removeItem?: (info: { [name: string]: { value?: string } }) => void;
                                confirmItem?: (info: { [name: string]: { value?: string } }) => void;
                                removeConfirmationMessage? : string;
                                objectLabel: string;
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

        const config = TracaListFactoryService.LIST_TYPE_CONFIG[listType];

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
                                action: validate
                            }
                        }
                        : {}
                )
            },
            body: notDuplicateArticles.map(({date, ref_article, quantity, quantite, nature_id}) => {
                const natureConfig = (natureIdsToConfig && nature_id && natureIdsToConfig[nature_id]);
                const infos = {
                    object: {
                        label: 'Objet',
                        value: ref_article
                    },
                    ...(quantity || quantite
                        ? {
                            quantity: {
                                label: 'Quantité',
                                value: String(quantity || quantite)
                            }
                        }
                        : {}),
                    date: {
                        label: 'Date / Heure',
                        value: moment(date, moment.defaultFormat).format('DD/MM/YYYY HH:mm:ss')
                    },
                    ...(
                        natureConfig ? {
                            quantity: {
                                label: 'Nature',
                                value: natureConfig.label
                            }
                        }
                        : {}),
                };
                return {
                    infos,
                    color: natureConfig && natureConfig.color,
                    longPressAction: (
                        removeConfirmationMessage && removeItem
                            ? (info: { [name: string]: { value?: string } }) => {
                                this.createConfirmationBoxAlert(removeConfirmationMessage, () => removeItem(info))
                            }
                            : removeItem
                    ),
                    pressAction: confirmItem,
                    ...(uploadItem
                        ? {
                            rightIcon: {
                                color: 'grey' as IconColor,
                                name: 'up.svg',
                                action: () => uploadItem(infos)
                            }
                        }
                        : {})
                };
            })
        }
    }
}
