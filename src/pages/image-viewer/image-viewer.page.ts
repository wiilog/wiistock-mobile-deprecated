import {Component} from '@angular/core';
import {NavService} from '@app/common/services/nav/nav.service';

@Component({
    selector: 'wii-image-viewer',
    templateUrl: './image-viewer.page.html',
    styleUrls: ['./image-viewer.page.scss'],
})
export class ImageViewerPage {

    public url: string;

    public label: string;

    constructor(private navService: NavService) {}

    public ionViewWillEnter(): void {
        let params = this.navService.getParams(this.navService.getCurrentParamId());
        this.url = params.get(`url`);
        this.label = params.get(`label`);
    }

    public close(): void {
        this.navService.pop();
    }

}
