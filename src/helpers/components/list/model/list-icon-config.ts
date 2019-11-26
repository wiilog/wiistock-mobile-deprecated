import {IconColor} from "@helpers/components/icon/icon-color";

export interface ListIconConfig {
    name: string;
    color: IconColor;
    action?: () => void;
}
