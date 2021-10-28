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

    private static CreateTranslationDictionaryFromArray(translations: Array<Translation>): {[label: string]: string} {
        return translations.reduce((acc, {label, translation}) => ({
            ...acc,
            [label]: translation
        }), {});
    }

    public get(entity?: string): Observable<Translations> {
        return this.sqliteService
            .findBy('translations', entity ? [`menu LIKE '${entity}'`] : [])
            .pipe(
                map((translations: Array<Translation>) => TranslationService.CreateTranslationDictionaryFromArray(translations))
            );
    }
}
