import {Component, Input} from '@angular/core';
import {FormViewerAttachmentConfig} from '@app/common/components/panel/model/form-viewer/form-viewer-attachment-config';
import {NavService} from "@app/common/services/nav/nav.service";
import {NavPathEnum} from "@app/common/services/nav/nav-path.enum";

declare let cordova: any;

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

    public constructor(private navService: NavService) {}

    public proceedAction(url: string, label: string) {
        const extension = label.split('.').pop();

        if(extension === `pdf`) {
            this.viewPDF(url);
        } else {
            this.viewImage(url, label);
        }
    }

    private viewImage(url: string, label?: string) {
        this.navService.push(NavPathEnum.IMAGE_VIEWER, {
            url,
            label,
        });
    }

    private viewPDF(url: string) {
        cordova.InAppBrowser.open(url, '_system');
    }
}
