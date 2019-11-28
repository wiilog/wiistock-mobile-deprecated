import {Injectable} from '@angular/core';
import {HeaderConfig} from "@helpers/components/panel/model/header-config";
import {ListPanelItemConfig} from "@helpers/components/panel/model/list-panel/list-panel-item-config";
import {Article} from "@app/entities/article";
import {Emplacement} from "@app/entities/emplacement";
import {MouvementTraca} from "@app/entities/mouvement-traca";


@Injectable()
export class TracaListFactoryService {

    public createListPriseConfig(articles: Array<MouvementTraca>, location: Emplacement): {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    } {
        const pickedArticlesNumber = articles.length;
        const plural = pickedArticlesNumber > 1 ? 's' : '';

        return {
            header: {
                title: 'PRISE',
                subtitle: `Emplacement : ${location.label}`,
                info: `${pickedArticlesNumber} produit${plural} scanné${plural}`,
                leftIcon: {
                    name: 'upload.svg',
                    color: 'primary'
                }
            },
            body: articles.map(({date, ref_article}) => ({
                infos: {
                    object: {
                        label: 'Objet',
                        value: ref_article
                    },
                    date: {
                        label: 'Date / Heure',
                        value: date
                    }
                }
            }))
        }
    }
}
