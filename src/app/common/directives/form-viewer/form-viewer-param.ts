import {Type} from '@angular/core';
import {FormAttachmentViewerComponent} from '@app/common/components/panel/form-panel/form-attachments-viewer/form-attachment-viewer.component';
import {AttachmentsViewerParam} from '@app/common/components/panel/model/details-viewer/attachments-viewer-param';

interface FormAttachmentViewerParam {
    item: Type<FormAttachmentViewerComponent>;
    config: AttachmentsViewerParam;
}

export type FormViewerParam = FormAttachmentViewerParam;
