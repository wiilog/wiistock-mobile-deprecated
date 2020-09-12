import {Component, Input} from '@angular/core';
import {AttachmentsViewerParam} from '@app/common/components/panel/model/details-viewer/attachments-viewer-param';


@Component({
    selector: 'wii-form-attachment-viewer',
    templateUrl: 'form-attachment-viewer.component.html',
    styleUrls: ['./form-attachment-viewer.component.scss']
})
export class FormAttachmentViewerComponent implements AttachmentsViewerParam {

    @Input()
    public label: string;

    @Input()
    public values: Array<{
        label: string;
        href: string;
    }>;
}
