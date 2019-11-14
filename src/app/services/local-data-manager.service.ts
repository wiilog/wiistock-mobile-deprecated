import {Injectable} from '@angular/core';
import {Article} from '@app/entities/article';
import {Emplacement} from '@app/entities/emplacement';
import {Observable} from 'rxjs';
import moment from 'moment';
import {flatMap, map} from 'rxjs/operators';
import {StorageService} from '@app/services/storage.service';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import 'rxjs/add/observable/zip';


@Injectable()
export class LocalDataManagerService {

    public constructor(private storageService: StorageService,
                       private sqliteProvider: SqliteProvider) {}


    public saveMouvementsTraca(articles: Array<Article>,
                               emplacement: Emplacement,
                               type: 'depose'|'prise'): Observable<any> {
        const date = moment().format();

        // we count articles
        const uniqueArticles: Array<{article: Article, cpt: number}> = articles.reduce((acc: Array<{article, cpt: number}>, {reference}: Article) => {
            const index = acc.findIndex(({article: articleToCmp}) => (articleToCmp.reference === reference));
            if (index > -1) {
                acc[index].cpt++;
            }
            else {
                acc.push({
                    article: {reference},
                    cpt: 1
                })
            }
            return acc;
        }, []);

        const setValue = (ref_article, cpt) => (
            (type === 'depose')
                ? this.storageService.setDeposeValue(ref_article, cpt)
                // type === 'prise'
                : this.storageService.setPriseValue(ref_article, cpt)
        );

        // we save users
        return this.storageService.getOperateur().pipe(
            map((operateur) => (
                uniqueArticles.map(({article, cpt}) => ({
                    id: null,
                    ref_article: article.reference,
                    date: date + '_' + Math.random().toString(36).substr(2, 9),
                    ref_emplacement: emplacement.label,
                    type,
                    operateur,
                    cpt
                }))
            )),
            flatMap((mouvements) => (
                //we save cpt
                Observable.zip(...mouvements.map((mouvement) => setValue(mouvement.ref_article, mouvement.cpt)))
                    .pipe(map(() => mouvements))
            )),
            flatMap((mouvements) => (
                // we save the mouvement
                Observable.zip(...mouvements.map(({cpt, ...mouvement}) => this.sqliteProvider.insert('`mouvement_traca`', mouvement)))
            )),
            map(() => undefined)
        )
    }
}
