import {DetailsViewerParam} from '@app/common/components/panel/model/details-viewer/details-viewer-param';

export interface AttachmentsViewerParam extends DetailsViewerParam {
    values: Array<{
        label: string;
        href: string;
    }>;
}
