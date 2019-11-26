import {ListIconConfig} from '@helpers/components/list/model/list-icon-config';


export interface ListElementConfig {
    infos: {
        [name: string]: {
            label: string;
            value: string;
        };
    };
    rightIcon?: ListIconConfig;
}
