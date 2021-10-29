import {IconConfig} from '@app/common/components/panel/model/icon-config';


export interface ActionConfig {
    label: string;
    action: (event: Event) => void;
    icon?: IconConfig;
}
