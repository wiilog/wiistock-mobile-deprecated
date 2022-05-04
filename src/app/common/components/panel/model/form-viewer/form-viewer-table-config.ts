import {FormViewerDetailsConfig} from '@app/common/components/panel/model/form-viewer/form-viewer-details-config';

export type NatureWithQuantity = {
    color: string;
    title: string;
    label: string;
    value: number|string;
};

export interface FormViewerTableConfig extends FormViewerDetailsConfig {
    value: Array<NatureWithQuantity>;
}
