import {IconConfig} from '@app/common/components/panel/model/icon-config';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';

export interface CardListConfig {
    title: {label: string;value: string;} | Array<{label: string;value: string;}>;
    content: Array<{
        label?: string;
        value?: string;
        itemConfig?: ListPanelItemConfig;
    }>;
    customColor?: string;
    rightIcon?: IconConfig;
    action?: () => void;
    info?: string;
    error?: string;
    itemBoldValues?: Array<string>;
}
