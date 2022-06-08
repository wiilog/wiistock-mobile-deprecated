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

    public treatTransport(transport: TransportRoundLine, updated: TransportRound) {
        const currentRound = transport.round;

        //clear the round
        for(const key in currentRound) {
            delete currentRound[key];
        }

        //update the round's properties
        Object.assign(currentRound, updated);

        //add back references to the round on the transport
        for(const transport of currentRound.lines) {
            transport.round = currentRound;
            if(transport.collect) {
                transport.collect.round = currentRound;
            }
        }
    }

}
