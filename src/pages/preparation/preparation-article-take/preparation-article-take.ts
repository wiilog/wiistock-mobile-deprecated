import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {ArticlePrepa} from '@app/entities/article-prepa';
import {Preparation} from '@app/entities/preparation';
import {ToastService} from "@app/services/toast.service";
import {ArticlePrepaByRefArticle} from "@app/entities/article-prepa-by-ref-article";


@IonicPage()
@Component({
    selector: 'page-preparation-article-take',
    templateUrl: 'preparation-article-take.html',
})
export class PreparationArticleTakePage {

    public article: ArticlePrepa & ArticlePrepaByRefArticle;
    public refArticle: ArticlePrepa;
    public quantite: number;
    public preparation: Preparation;

    private onlyOne: boolean;
    private selectArticle: (quantity: number) => void;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public toastService: ToastService) {}

    public ionViewWillEnter(): void {
        this.article = this.navParams.get('article');
        this.refArticle = this.navParams.get('refArticle');
        this.preparation = this.navParams.get('preparation');
        this.selectArticle = this.navParams.get('selectArticle');
        this.onlyOne = this.navParams.get('onlyOne');

        this.quantite = this.maxQuantityAvailable;
    }

    public addArticle(): void {
        const maxQuantityAvailable = this.maxQuantityAvailable;
        if (!this.quantite || (this.quantite > maxQuantityAvailable) || this.quantite <= 0) {
            this.toastService.showToast('Veuillez sélectionner une quantité valide.');
        }
        else if (this.onlyOne && this.quantite !== maxQuantityAvailable) {
            this.toastService.showToast(`La quantité souhaitée doit obligatoirement être égale à `);
        }
        else {
            this.selectArticle(this.quantite);
            this.navCtrl.pop();
        }
    }

    public get availableQuantity(): number {
        return this.article && (this.article.isSelectableByUser ? this.article.quantity : this.article.quantite);
    }

    public get quantityToSelect(): number {
        return this.article && (this.article.isSelectableByUser ? this.refArticle.quantite : this.article.quantite);
    }

    public get maxQuantityAvailable(): number {
        const availableQuantity = this.availableQuantity;
        const quantityToSelect = this.quantityToSelect;
        return (availableQuantity < quantityToSelect) ? availableQuantity : quantityToSelect;
    }
}
