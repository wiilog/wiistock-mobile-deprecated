import {Injectable} from '@angular/core';
import {Article} from '@app/entities/article';
import moment from "moment";


@Injectable()
export class EntityFactoryService {
    public createArticleBarcode(barCode: string): Article {
        return {
            id: (new Date()).getUTCMilliseconds(),
            label: null,
            reference: barCode,
            quantite: null,
            barcode: barCode,
            date: moment().format('DD/MM/YYYY HH:mm:ss')
        };
    }
}
