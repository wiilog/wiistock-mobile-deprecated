import {IconColor} from '@app/common/components/icon/icon-color';

export interface IconConfig {
    name: string;
    color?: IconColor;
    action?: () => void;
}
