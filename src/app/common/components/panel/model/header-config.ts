import {IconConfig} from '@app/common/components/panel/model/icon-config';


export interface HeaderConfig {
    leftIcon?: IconConfig;
    title: string;
    subtitle?: string;
    info?: string;
    rightIcon?: IconConfig;
}
