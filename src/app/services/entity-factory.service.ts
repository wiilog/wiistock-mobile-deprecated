import {Injectable} from '@angular/core';
import {Article} from '@app/entities/article';

@Injectable()
export class EntityFactoryService {
    public createArticleBarcode(barCode: string): Article {
        return {
            id: (new Date()).getUTCMilliseconds(),
            label: null,
            reference: barCode,
            quantite: null,
            barcode: barCode
        };
    }
}
