import {ViewController} from 'ionic-angular';

export interface TitleConfig {
    label: string;
    pageName: string;
    filter?: (instance: any) => boolean;
    view?: ViewController;
    enableClick?: boolean;
}
