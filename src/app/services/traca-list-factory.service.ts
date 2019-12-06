import {Injectable} from '@angular/core';
import {HeaderConfig} from '@helpers/components/panel/model/header-config';
import {ListPanelItemConfig} from '@helpers/components/panel/model/list-panel/list-panel-item-config';
import {Emplacement} from '@app/entities/emplacement';
import {MouvementTraca} from '@app/entities/mouvement-traca';
import moment from "moment";


@Injectable()
export class TracaListFactoryService {

    public createListConfig(articles: Array<MouvementTraca>, location: Emplacement, fromPrise: boolean, validate?: () => void): {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    } {
        const pickedArticlesNumber = articles.length;
        const plural = pickedArticlesNumber > 1 ? 's' : '';

        return {
            header: {
                title: fromPrise ? 'PRISE' : 'DEPOSE',
                subtitle: `Emplacement : ${location.label}`,
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
            body: articles.map(({date, ref_article, quantity}) => ({
                infos: {
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
                }
            }))
        }
    }
}
