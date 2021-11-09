import {Injectable} from '@angular/core';
import {Connection, Network} from '@ionic-native/network/ngx';


@Injectable({
    providedIn: 'root'
})
export class NetworkService {

    public constructor(private network: Network) {}

    public hasNetwork(): boolean {
        return (
            this.network.type
            && this.network.type !== Connection.UNKNOWN
            && this.network.type !== Connection.NONE
        );
    }
}
