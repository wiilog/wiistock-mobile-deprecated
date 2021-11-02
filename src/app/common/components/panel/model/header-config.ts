import {IconConfig} from '@app/common/components/panel/model/icon-config';
import {ListPanelItemConfig} from "@app/common/components/panel/model/list-panel/list-panel-item-config";
import {IconColor} from '@app/common/components/icon/icon-color';


export interface HeaderConfig {
    color?: string;
    item?: ListPanelItemConfig;
    leftIcon?: IconConfig;
    title?: string;
    subtitle?: string|Array<string>;
    info?: string;
    action?: (event: Event) => void;
    rightIcon?: IconConfig|Array<IconConfig>;
    collapsed?: true;
    onToggle?: (opened: boolean) => void;
    transparent?: boolean;
    leftBadge?: {label: string; color: string};
    rightBadge?: {label: string; color: string};
    headerButtonConfig?: {
        label: string;
        icon: IconConfig;
        action?: () => void
    };
}
