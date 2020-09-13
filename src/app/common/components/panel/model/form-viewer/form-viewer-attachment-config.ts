import {FormViewerDetailsConfig} from '@app/common/components/panel/model/form-viewer/form-viewer-details-config';

export interface FormViewerAttachmentConfig extends FormViewerDetailsConfig {
    values: Array<{
        label: string;
        href: string;
    }>;
}
