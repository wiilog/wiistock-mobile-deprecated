import {IconConfig} from '@app/common/components/panel/model/icon-config';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';
import {BadgeConfig} from '@app/common/components/badge/badge-config';

export interface CardListConfig {
    badges?: Array<BadgeConfig>;
    title: {label: string;value: string;} | Array<{label: string;value: string;}>;
    titleFlex?: boolean;
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
