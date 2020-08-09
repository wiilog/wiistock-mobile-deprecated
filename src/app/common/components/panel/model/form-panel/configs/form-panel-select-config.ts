import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';

export interface FormPanelSelectConfig {
    required?: boolean;
    barcodeScanner?: boolean;
    searchType?: SelectItemTypeEnum;
    requestParams?: Array<string>;
    elements?: Array<{id: number; label: string;}>;
    isMultiple?: boolean
}
