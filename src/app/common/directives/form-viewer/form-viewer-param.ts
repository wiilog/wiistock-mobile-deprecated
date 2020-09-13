import {Type} from '@angular/core';
import {FormViewerAttachmentConfig} from '@app/common/components/panel/model/form-viewer/form-viewer-attachment-config';
import {FormViewerAttachmentsComponent} from '@app/common/components/panel/form-panel/form-viewer-attachments/form-viewer-attachments.component';

interface FormViewerAttachmentsParam {
    item: Type<FormViewerAttachmentsComponent>;
    config: FormViewerAttachmentConfig;
}

export type FormViewerParam = FormViewerAttachmentsParam;
