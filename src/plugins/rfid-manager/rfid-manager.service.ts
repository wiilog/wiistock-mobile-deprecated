import {Injectable} from "@angular/core";
import {registerPlugin} from "@capacitor/core";
import {RfidManagerPlugin} from "./definitions";
import {Observable, Subject} from "rxjs";
import {PluginListenerHandle} from "@capacitor/core/types/definitions";

@Injectable()
export class RfidManagerService {

    private rfidManagerPlugin: RfidManagerPlugin;

    private eventsLaunched: boolean;
    private _tagsRead$?: Subject<{ tags: Array<string> }>;
    private _scanStarted$?: Subject<void>;
    private _scanStopped$?: Subject<void>;
    private listeners: Array<PluginListenerHandle>;

    public constructor() {
        this.rfidManagerPlugin = registerPlugin<RfidManagerPlugin>('RfidManager');
        this.eventsLaunched = false;
        this.listeners = [];
    }

    public get tagsRead$(): Observable<{ tags: Array<string> }> {
        if (!this._tagsRead$) {
            throw new Error("Event listeners not launched");
        }
        return this._tagsRead$;
    }

    public get scanStarted$(): Observable<void> {
        if (!this._scanStarted$) {
            throw new Error("Event listeners not launched");
        }
        return this._scanStarted$;
    }

    public get scanStopped$(): Observable<void> {
        if (!this._scanStopped$) {
            throw new Error("Event listeners not launched");
        }
        return this._scanStopped$;
    }

    public launchEventListeners(): void {
        if (this.eventsLaunched) {
            throw new Error("Event listeners already launched");
        }
        this._tagsRead$ = new Subject();
        this.rfidManagerPlugin
            .addListener('tagsRead', (data) => {
                this._tagsRead$?.next(data);
            })
            .then((listener) => {
                this.listeners.push(listener);
            });

        this._scanStarted$ = new Subject();
        this.rfidManagerPlugin
            .addListener('scanStarted', (data) => {
                this._scanStarted$?.next(data);
            })
            .then((listener) => {
                this.listeners.push(listener);
            });

        this._scanStopped$ = new Subject();
        this.rfidManagerPlugin
            .addListener('scanStopped', (data) => {
                this._scanStopped$?.next(data);
            })
            .then((listener) => {
                this.listeners.push(listener);
            });

        this.eventsLaunched = true;
    }

    public removeEventListeners(): void {
        this.listeners.forEach((listener) => {
            listener.remove();
        });
        this.listeners = [];

        this._tagsRead$?.unsubscribe();
        this._tagsRead$ = undefined;

        this._scanStarted$?.unsubscribe();
        this._scanStarted$ = undefined;

        this._scanStopped$?.unsubscribe();
        this._scanStopped$ = undefined;

        this.eventsLaunched = false;
    }

    public connect(): void {
        this.rfidManagerPlugin
            .run({
                action: 'connect'
            })
            .then((result) => {
                console.log('connect', result);
            })
            .catch((error) => {
                console.error(error)
            });
    }

    public startScan(): void {
        this.rfidManagerPlugin
            .run({
                action: 'startScan'
            })
            .then((result) => {
                console.log('startScan', result);
            })
            .catch((error) => {
                console.error(error)
            });
    }

    public stopScan(): void {
        this.rfidManagerPlugin
            .run({
                action: 'stopScan'
            })
            .then((result) => {
                console.log('stopScan', result);
            })
            .catch((error) => {
                console.error(error)
            });
    }

    public configure(): void {
        this.rfidManagerPlugin
            .run({
                action: 'configure'
            })
            .then((result) => {
                console.log('configure', result);
            })
            .catch((error) => {
                console.error(error)
            });
    }

    public connectedDeviceInfo(): void {
        this.rfidManagerPlugin
            .run({
                action: 'connectedDeviceInfo'
            })
            .then((result) => {
                console.log('connectedDeviceInfo', result);
            })
            .catch((error) => {
                console.error(error)
            });
    }

    public disconnect(): void {
        this.rfidManagerPlugin
            .run({
                action: 'disconnect'
            })
            .then((result) => {
                console.log('disconnect', result);
            })
            .catch((error) => {
                console.error(error)
            });
    }

}
