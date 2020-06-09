import {IconColor} from '@app/common/components/icon/icon-color';

export interface MenuConfig {
    icon: string;
    iconColor?: IconColor;
    label: string;
    action?: () => void;
}
