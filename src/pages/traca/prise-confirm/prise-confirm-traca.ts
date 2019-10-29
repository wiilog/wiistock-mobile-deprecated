import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {PriseArticlesPageTraca} from "../prise-articles/prise-articles-traca";
import {Article} from '@app/entities/article';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {Emplacement} from '@app/entities/emplacement';
import {IonicSelectableComponent} from "ionic-selectable";
import {ToastService} from "@app/services/toast.service";

@IonicPage()
@Component({
    selector: 'page-prise-confirm',
    templateUrl: 'prise-confirm-traca.html',
})
export class PriseConfirmPageTraca {

    article: Article;
    articles: Array<Article>;
    db_articles: Array<Article>;
    emplacement: Emplacement;

    private selectArticle: (article) => void;

    constructor(public navCtrl: NavController, public navParams: NavParams, public sqliteProvider: SqliteProvider, private toastService: ToastService) {

    }

    public ionViewWillEnter(): void {
        this.articles = this.navParams.get('articles');
        this.selectArticle = this.navParams.get('selectArticle');
        this.emplacement = this.navParams.get('emplacement');
        if (this.navParams.get('selectedArticle') !== undefined) {
            this.article = this.navParams.get('selectedArticle');
            this.db_articles = [this.navParams.get('selectedArticle')];
        } else {
            this.sqliteProvider.findAll('article').subscribe((value) => {
                this.db_articles = value;
            });
        }
    }

    articleChange(event: { component: IonicSelectableComponent, value: any }) {
        this.selectArticle(event.value);
    }

    searchArticle(event: { component: IonicSelectableComponent, text: string }) {
        let text = event.text.trim();
        event.component.startSearch();
        this.sqliteProvider.findByElement('article', 'id', text).subscribe((items) => {
            event.component.items = items;
            event.component.endSearch();
        });
    }

    addArticle() {
        if (this.article) {

            if (typeof (this.articles) !== 'undefined') {
                this.articles.push(this.article);
            } else {
                this.articles = [this.article];
            }
            this.navCtrl.push(PriseArticlesPageTraca, {articles: this.articles, emplacement: this.emplacement});
        } else {
            this.toastService.showToast("Cet article n'existe pas en stock.");
        }
    };

}
