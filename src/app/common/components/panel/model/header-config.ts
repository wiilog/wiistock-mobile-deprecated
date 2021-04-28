import {IconConfig} from '@app/common/components/panel/model/icon-config';
import {ListPanelItemConfig} from "@app/common/components/panel/model/list-panel/list-panel-item-config";


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
}
