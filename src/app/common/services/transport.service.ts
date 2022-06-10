import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {Translation, Translations} from "@entities/translation";
import {Injectable} from "@angular/core";
import {map} from 'rxjs/operators';
import {Observable, Subject} from 'rxjs';
import {TransportRoundLine} from '@entities/transport-round-line';
import {TransportRound} from '@entities/transport-round';

@Injectable({
    providedIn: 'root'
})
export class TransportService {

    public treatTransport(previousRound: TransportRound, updated: TransportRound) {
        //clear the round
        for(const key in previousRound) {
            delete previousRound[key];
        }

        //update the round's properties
        Object.assign(previousRound, updated);
    }
}
