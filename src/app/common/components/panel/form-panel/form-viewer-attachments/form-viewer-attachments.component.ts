import {Component, Input} from '@angular/core';
import {FormViewerAttachmentConfig} from '@app/common/components/panel/model/form-viewer/form-viewer-attachment-config';


@Component({
    selector: 'wii-form-viewer-attachments',
    templateUrl: 'form-viewer-attachments.component.html',
    styleUrls: ['./form-viewer-attachments.component.scss']
})
export class FormViewerAttachmentsComponent implements FormViewerAttachmentConfig {

    @Input()
    public label: string;

    @Input()
    public value: Array<{
        label: string;
        href: string;
    }>;

    @Input()
    public inline?: boolean;
}
