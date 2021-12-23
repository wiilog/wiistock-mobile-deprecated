import {IconConfig} from '@app/common/components/panel/model/icon-config';
import {ListPanelItemConfig} from "@app/common/components/panel/model/list-panel/list-panel-item-config";
import {BadgeConfig} from '@app/common/components/badge/badge-config';


export interface HeaderConfig {
    color?: string;
    item?: ListPanelItemConfig;
    leftIcon?: IconConfig;
    title?: string;
    subtitle?: string|Array<string>;
    info?: string;
    action?: (event: Event) => void;
    rightIcon?: IconConfig|Array<IconConfig>;
    rightIconLayout?: 'vertical'|'horizontal';
    collapsed?: true;
    onToggle?: (opened: boolean) => void;
    transparent?: boolean;
    leftBadge?: BadgeConfig;
    rightBadge?: BadgeConfig;
    headerButtonConfig?: {
        label: string;
        icon: IconConfig;
        action?: () => void
    };
}
