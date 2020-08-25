import {IconConfig} from '@app/common/components/panel/model/icon-config';

export interface CardListConfig {
    title: {
        label: string;
        value: string;
    };
    content: Array<{
        label: string;
        value: string;
    }>;
    rightIcon?: IconConfig;
    action?: () => void;
    info?: string;
    error?: string;
}
