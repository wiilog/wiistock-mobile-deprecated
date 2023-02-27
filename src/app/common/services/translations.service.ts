import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {Translation, Translations} from "@entities/translation";
import {Injectable} from "@angular/core";
import {map} from 'rxjs/operators';
import {Observable, Subject} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TranslationService {

    public readonly changedTranslations$: Subject<void>;

    public constructor(private sqliteService: SqliteService) {
        this.sqliteService = sqliteService;
        this.changedTranslations$ = new Subject();
    }

    public static Translate(translations: Translations, field: string): string {
        return translations[field] || field;
    }

    public static CreateTranslationDictionaryFromArray(translations: Array<Translation>): {[label: string]: string} {
        return translations.reduce((acc, {label, translation}) => ({
            ...acc,
            [label]: translation
        }), {});
    }

    public get(...args): Observable<Translations> {
        const [topMenu, menu, subMenu] = args;
        return this.sqliteService
            .findBy('translations', args.length > 0
                ? [`topMenu LIKE '${topMenu || ``}' AND menu LIKE '${menu || ``}' AND subMenu LIKE '${subMenu || ``}'`]
                : [])
            .pipe(
                map((translations: Array<Translation>) => TranslationService.CreateTranslationDictionaryFromArray(translations))
            );
    }

    public getRaw(...args): Observable<Array<Translation>> {
        const [topMenu, menu, subMenu] = args;
        return this.sqliteService
            .findBy('translations', args.length > 0
                ? [`topMenu LIKE '${topMenu || ``}' AND menu LIKE '${menu || ``}' AND subMenu LIKE '${subMenu || ``}'`]
                : []);
    }
}
