import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {Translation} from "@entities/translation";
import {Injectable} from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class TranslationService {

    public constructor(private sqliteService: SqliteService) {
        this.sqliteService = sqliteService;
    }

    public find(entity: string) {
        return this.sqliteService.findBy('translations', [`menu LIKE '${entity}'`])
    }

    public get(translations: Array<Translation>) {
        return translations.reduce((acc, {label, translation}) => ({
            ...acc,
            [label]: translation
        }), {});
    }

    public translate(translations: {[label: string]: string}, field: string) {
        return translations[field] || field;
    }
}
