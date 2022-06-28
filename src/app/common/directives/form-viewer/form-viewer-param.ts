import {Type} from '@angular/core';
import {FormViewerAttachmentConfig} from '@app/common/components/panel/model/form-viewer/form-viewer-attachment-config';
import {FormViewerAttachmentsComponent} from '@app/common/components/panel/form-panel/form-viewer-attachments/form-viewer-attachments.component';
import {FormViewerTextComponent} from '@app/common/components/panel/form-panel/form-viewer-text/form-viewer-text.component';
import {FormViewerTextConfig} from '@app/common/components/panel/model/form-viewer/form-viewer-text-config';
import {FormViewerTableComponent} from '@app/common/components/panel/form-panel/form-viewer-table/form-viewer-table.component';
import {FormViewerTableConfig} from '@app/common/components/panel/model/form-viewer/form-viewer-table-config';

interface FormViewerAttachmentsParam {
    item: Type<FormViewerAttachmentsComponent>;
    config: FormViewerAttachmentConfig;
}

interface FormViewerTextParam {
    item: Type<FormViewerTextComponent>;
    config: FormViewerTextConfig;
}

interface FormViewerTableParam {
    item: Type<FormViewerTableComponent>;
    config: FormViewerTableConfig;
}

export type FormViewerParam = FormViewerAttachmentsParam
                            | FormViewerTextParam
                            | FormViewerTableParam;
