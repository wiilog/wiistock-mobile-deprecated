import {ChangeDetectorRef, Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {ArticleCollecte} from '@app/entities/article-collecte';
import {ToastService} from "@app/services/toast.service";

@IonicPage()
@Component({
    selector: 'page-collecte-article-take',
    templateUrl: 'collecte-article-take.html',
})
export class CollecteArticleTakePage {

    public article: ArticleCollecte;
    public quantity: number;

    private selectArticle: (quantity: number) => void;

    public constructor(private navCtrl: NavController,
                       private navParams: NavParams,
                       private changeDetector: ChangeDetectorRef,
                       private toastService: ToastService) {
    }

    public ionViewWillEnter(): void {
        this.article = this.navParams.get('article');
        this.selectArticle = this.navParams.get('selectArticle');
        this.quantity = this.article.quantite;
        this.changeDetector.detectChanges();

    }

    public addArticle(): void {
        if (this.quantity > this.article.quantite || this.quantity <= 0) {
            this.toastService.showToast('Veuillez selectionner une quantité valide.');
        }
        else {
            this.selectArticle(this.quantity);
            this.navCtrl.pop();
        }
    }
}
