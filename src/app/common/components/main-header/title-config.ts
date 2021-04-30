import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';

export interface TitleConfig {
    label?: string;
    pagePath: NavPathEnum;
    filter?: (data: Map<string, any>) => boolean;
    stackIndex?: number;
    paramsId?: number;
}
