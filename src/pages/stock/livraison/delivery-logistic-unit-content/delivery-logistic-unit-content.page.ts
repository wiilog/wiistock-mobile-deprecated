import {Component} from '@angular/core';
import {NavService} from '@app/common/services/nav/nav.service';
import {PageComponent} from '@pages/page.component';
import {ViewWillEnter} from '@ionic/angular';
import {ArticleLivraison} from "@entities/article-livraison";
import {IconConfig} from "@app/common/components/panel/model/icon-config";
import {ListPanelItemConfig} from "@app/common/components/panel/model/list-panel/list-panel-item-config";
import {ArticlePrepa} from "@entities/article-prepa";

@Component({
    selector: 'wii-delivery-logistic-unit-content',
    templateUrl: './delivery-logistic-unit-content.page.html',
    styleUrls: ['./delivery-logistic-unit-content.page.scss'],
})
export class DeliveryLogisticUnitContentPage extends PageComponent implements ViewWillEnter {

    public articles: Array<ArticleLivraison|ArticlePrepa>;
    public logisticUnit: string;
    public listBoldValues?: Array<string> = ['label', 'barcode', 'location', 'quantity'];

    public logisticUnitHeaderConfig?: {
        leftIcon: IconConfig;
        title: string;
        subtitle?: string;
    };

    public articlesConfig?: {
        body: Array<ListPanelItemConfig>;
    };

    private callback: () => void;

    public extraArticles: Array<string> = [];


    public constructor(navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.articles = this.currentNavParams.get(`articles`);
        this.logisticUnit = this.currentNavParams.get(`logisticUnit`);
        this.callback = this.currentNavParams.get(`callback`);

        this.logisticUnitHeaderConfig = {
            leftIcon: {
                name: `logistic-unit.svg`
            },
            title: `Contenu unité logistique`,
            subtitle: this.logisticUnit
        }

        this.refreshArticlesConfig();
    }

    public refreshArticlesConfig(): void {
        this.articlesConfig = {
            body: this.articles
                .map((article: ArticleLivraison|ArticlePrepa) => ({
                    infos: {
                        label: {
                            label: 'Libellé',
                            value: article.label
                        },
                        barcode: {
                            label: `Code barre`,
                            value: article.barcode
                        },
                        location: {
                            label: `Emplacement`,
                            value: `location` in article ? article.location : article.emplacement
                        },
                        quantity: {
                            label: `Quantité`,
                            value: `${'quantity' in article ? article.quantity : article.quantite}`
                        }
                    },
                    ...(this.extraArticles.includes(article.barcode)
                        ? {selected: true}
                        : {})
                }))
                .sort((article) => article.selected ? -1 : 1)
        }
    }

    public back() {
        this.navService.pop();
    }
}
