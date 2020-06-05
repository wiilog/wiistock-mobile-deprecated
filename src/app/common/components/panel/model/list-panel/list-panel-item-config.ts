import {IconConfig} from '@app/common/components/panel/model/icon-config';


export interface ListPanelItemConfig {
    infos: {
        [name: string]: {
            label: string;
            value: string;
        };
    };
    longPressAction?: (infos: {[name: string]: {label: string; value: string;};}) => void;
    pressAction?: (infos: {[name: string]: {label: string; value: string;};}) => void;
    rightIcon?: IconConfig;
}
