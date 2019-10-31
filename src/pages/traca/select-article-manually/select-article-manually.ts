import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {Article} from '@app/entities/article';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {IonicSelectableComponent} from 'ionic-selectable';


@IonicPage()
@Component({
    selector: 'page-select-article-manually',
    templateUrl: 'select-article-manually.html',
})
export class SelectArticleManuallyPage {

    public article: Article;
    public articles: Array<Article>;
    public db_articles: Array<Article>;

    private selectArticle: (article) => void;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public sqliteProvider: SqliteProvider) {
    }

    public ionViewWillEnter(): void {
        this.articles = this.navParams.get('articles');
        this.selectArticle = this.navParams.get('selectArticle');
        if (this.navParams.get('selectedArticle') !== undefined) {
            this.article = this.navParams.get('selectedArticle');
            this.db_articles = [this.navParams.get('selectedArticle')];
        }
        else {
            this.sqliteProvider.findAll('article').subscribe((value) => {
                this.db_articles = value;
            });
        }
    }

    public articleChange(event: { component: IonicSelectableComponent, value: any }): void {
        this.selectArticle(event.value);
        this.navCtrl.pop();
    }

    public searchArticle(event: { component: IonicSelectableComponent, text: string }): void {
        let text = event.text.trim();
        event.component.startSearch();
        this.sqliteProvider.findByElement('article', 'id', text).subscribe((items) => {
            event.component.items = items;
            event.component.endSearch();
        });
    }
}
