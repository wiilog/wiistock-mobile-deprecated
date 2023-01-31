import {Plugin, PluginListenerHandle} from "@capacitor/core/types/definitions";

type RunAction = 'connect'
               | 'disconnect'
               | 'configure'
               | 'connectedDeviceInfo'
               | 'startScan'
               | 'stopScan'
    ;

type PluginEvent = 'tagsRead'
                 | 'scanStarted'
                 | 'scanStopped'
    ;

export interface RunOptions {
    action: RunAction;
}

export interface RfidManagerPlugin extends Plugin {
    run(options: RunOptions): Promise<boolean>;

    addListener(event: PluginEvent, listener: (data: any) => void): Promise<PluginListenerHandle>;
}
