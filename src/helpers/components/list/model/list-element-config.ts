import {ListIconConfig} from '@helpers/components/list/model/list-icon-config';


export interface ListElementConfig {
    infos: Array<{
        [name: string]: {
            label: string;
            value: string;
        };
    }>;
    boldValues?: Array<string>;
    rightIcon?: ListIconConfig;
}
