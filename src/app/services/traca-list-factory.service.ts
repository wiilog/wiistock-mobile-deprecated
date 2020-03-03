import {Injectable} from '@angular/core';
import {HeaderConfig} from '@helpers/components/panel/model/header-config';
import {ListPanelItemConfig} from '@helpers/components/panel/model/list-panel/list-panel-item-config';
import {Emplacement} from '@app/entities/emplacement';
import {MouvementTraca} from '@app/entities/mouvement-traca';
import moment from "moment";
import {IconColor} from "@helpers/components/icon/icon-color";
import {AlertController} from "ionic-angular";
import {AlertManagerService} from "./alert-manager.service";


@Injectable()
export class TracaListFactoryService {

    private alertPresented: boolean;

    public constructor(private alertController: AlertController) {
        this.alertPresented = false;
    }

    public static CreateRemoveItemFromListHandler(listSource: Array<MouvementTraca>,
                                                  listDest: Array<MouvementTraca & { hidden?: boolean }> | undefined,
                                                  refreshList: () => void): (info: { object?: { value?: string } }) => void {
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
                refreshList();
            }
        }
    }

    private createConfirmationBoxAlert(message?: string, removeItem?: (info: { [name: string]: { value?: string } }) => void): void {
        if (!this.alertPresented) {
            this.alertPresented = true;
            let alert = this.alertController.create({
                title: 'Confirmation',
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
                    },
                ]
            });
            alert.onDidDismiss(() => {
                this.alertPresented = false;
            });
            alert.present();
        }
    }


    public createListConfig(articles: Array<MouvementTraca>,
                            fromPrise: boolean,
                            {location, validate, uploadItem, removeItem, removeConfirmationMessage}: {
                                location?: Emplacement;
                                validate?: () => void;
                                uploadItem?: (info: { object: { value?: string } }) => void;
                                removeItem?: (info: { [name: string]: { value?: string } }) => void;
                                removeConfirmationMessage? : string;
                            } = {}): {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    } {
        const pickedArticlesNumber = articles.length;
        const plural = pickedArticlesNumber > 1 ? 's' : '';

        return {
            header: {
                title: fromPrise ? 'PRISE' : 'DEPOSE',
                subtitle: location ? `Emplacement : ${location.label}` : undefined,
                info: `${pickedArticlesNumber} produit${plural} scanné${plural}`,
                leftIcon: {
                    name: fromPrise ? 'upload.svg' : 'download.svg',
                    color: fromPrise ? 'primary' : 'success'
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
            body: articles.map(({date, ref_article, quantity}) => {
                const infos = {
                    object: {
                        label: 'Objet',
                        value: ref_article
                    },
                    ...(quantity
                        ? {
                            quantity: {
                                label: 'Quantité',
                                value: String(quantity)
                            }
                        }
                        : {}),
                    date: {
                        label: 'Date / Heure',
                        value: moment(date, moment.defaultFormat).format('DD/MM/YYYY HH:mm:ss')
                    }
                };
                return {
                    infos,
                    longPressAction: (
                        removeConfirmationMessage && removeItem
                            ? (info: { [name: string]: { value?: string } }) => {
                                this.createConfirmationBoxAlert(removeConfirmationMessage, () => removeItem(info))
                            }
                            : removeItem
                    ),
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
