import {IconConfig} from '@helpers/components/panel/model/icon-config';


export interface ListPanelItemConfig {
    infos: {
        [name: string]: {
            label: string;
            value: string;
        };
    };
    rightIcon?: IconConfig;
}
