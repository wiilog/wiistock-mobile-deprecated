import {IconColor} from "@helpers/components/icon/icon-color";

export interface IconConfig {
    name: string;
    color: IconColor;
    action?: () => void;
}
