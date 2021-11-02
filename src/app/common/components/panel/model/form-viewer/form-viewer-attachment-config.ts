import {FormViewerDetailsConfig} from '@app/common/components/panel/model/form-viewer/form-viewer-details-config';

export interface FormViewerAttachmentConfig extends FormViewerDetailsConfig {
    value: Array<{
        label: string;
        href: string;
    }>;
    inline?: boolean;
}
