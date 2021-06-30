import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {Translation, Translations} from "@entities/translation";
import {Injectable} from "@angular/core";
import {flatMap, map} from 'rxjs/operators';
import {Observable} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TranslationService {

    public constructor(private sqliteService: SqliteService) {
        this.sqliteService = sqliteService;
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

    public get(entity: string): Observable<Translations> {
        return this.sqliteService
            .findBy('translations', [`menu LIKE '${entity}'`])
            .pipe(
                map((translations: Array<Translation>) => TranslationService.CreateTranslationDictionaryFromArray(translations))
            );
    }
}
