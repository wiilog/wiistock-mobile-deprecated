import {IconConfig} from '@app/common/components/panel/model/icon-config';


export interface ListPanelItemConfig {
    infos: {
        [name: string]: {
            label?: string;
            value: string;
        };
    };
    loading?: boolean;
    disabled?: boolean;
    color?: string;
    backgroundColor?: string;
    pressAction?: (infos: {[name: string]: {label: string; value: string;};}) => void;
    rightIcon?: IconConfig;
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
    },
    selected?: boolean;
}
