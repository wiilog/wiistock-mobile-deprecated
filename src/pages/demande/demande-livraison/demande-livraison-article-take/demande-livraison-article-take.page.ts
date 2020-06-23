import {Component} from '@angular/core';
import {NavService} from '@app/common/services/nav.service';
import {DemandeLivraisonArticle} from '@entities/demande-livraison-article';
import {ToastService} from '@app/common/services/toast.service';
import {PageComponent} from '@pages/page.component';


@Component({
    selector: 'wii-demande-livraison-article-take',
    templateUrl: './demande-livraison-article-take.page.html',
    styleUrls: ['./demande-livraison-article-take.page.scss'],
})
export class DemandeLivraisonArticleTakePage extends PageComponent {

    public simpleFormConfig: {
        title: string;
        info: Array<{label: string; value: string;}>
        fields: Array<{label: string; name: string; type: string; value: string|number;}>
    };

    private article: DemandeLivraisonArticle;
    private addArticleInDemande: (article: DemandeLivraisonArticle) => void;

    public constructor(private toastService: ToastService,
                       navService: NavService) {
        super(navService)
    }

    public ionViewWillEnter(): void {
        const navParams = this.navService.getCurrentParams();
        this.article = navParams.get('article');
        this.addArticleInDemande = navParams.get('addArticleInDemande');

        this.simpleFormConfig = {
            title: 'Confirmation quantité',
            info: [
                {label: 'Référence', value: this.article.reference},
                {
                    label: 'Gestion',
                    value: (
                        this.article.type_quantity === 'reference' ? 'Par référence' :
                        this.article.type_quantity === 'article' ? 'Par article' :
                        this.article.type_quantity
                    )
                },
                {label: 'Code barre', value: this.article.bar_code},
                {label: 'Quantité disponible', value: this.article.available_quantity ? String(this.article.available_quantity) : '-'}
            ],
            fields: [
                {
                    label: 'Quantité souhaitée',
                    name: 'quantity',
                    type: 'number',
                    value: this.article.quantity_to_pick || undefined
                }
            ]
        }
    }

    public addArticle({quantity}): void {
        if (!quantity || !Number(quantity) || quantity <= 0) {
            this.toastService.presentToast('Veuillez sélectionner une quantité valide.');
        }
        else {
            this.addArticleInDemande({
                ...this.article,
                quantity_to_pick: quantity
            });
            this.navService.pop();
        }
    }
}
