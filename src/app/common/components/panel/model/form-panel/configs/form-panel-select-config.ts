import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';

export interface FormPanelSelectConfig {
    required?: boolean;
    barcodeScanner?: boolean;
    defaultIfSingle?: boolean;
    searchType?: SelectItemTypeEnum;
    requestParams?: Array<string>;
    label?: string;
    elements?: Array<{id: number; label: string;}>;
    isMultiple?: boolean;
    filterItem?: (item: any) => boolean;
    onChange?: (item: any) => void;
    disabled?: boolean;
}
