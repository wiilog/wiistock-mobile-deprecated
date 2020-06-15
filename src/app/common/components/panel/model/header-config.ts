import {IconConfig} from '@app/common/components/panel/model/icon-config';


export interface HeaderConfig {
    leftIcon?: IconConfig;
    title: string;
    subtitle?: string|Array<string>;
    info?: string;
    action?: () => void;
    rightIcon?: IconConfig|Array<IconConfig>;
}
