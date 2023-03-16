import {IconConfig} from '@app/common/components/panel/model/icon-config';
import {IconColor} from "@app/common/components/icon/icon-color";


export interface ListPanelItemConfig {
    infos: {
        [name: string]: {
            label?: string;
            value: string;
            emergency?: boolean;
        };
    };
    loading?: boolean;
    disabled?: boolean;
    color?: string;
    backgroundColor?: string;
    pressAction?: (infos: {[name: string]: {label: string; value: string;};}) => void;
    rightIcon?: IconConfig;
    leftIcon?: IconConfig;
    rightButton?: {
        text: string;
        color?: string;
        action?: () => void;
    };
    rightIconBase64?: string;
    sliding?: boolean;
    slidingConfig?: {
        left: Array<{
            label: string,
            color: string,
            action: () => void
        }>,
        right: Array<{
            label: string,
            color: string,
            action: () => void
        }>,
    }
}
