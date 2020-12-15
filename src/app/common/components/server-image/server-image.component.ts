import {Component, Input, OnDestroy, OnInit, SecurityContext} from '@angular/core';
import {ServerImageKeyEnum} from '@app/common/components/server-image/server-image-key.enum';
import {ApiService} from '@app/common/services/api.service';
import {DomSanitizer} from '@angular/platform-browser';
import {Subscription} from 'rxjs';
import {ServerImageService} from '@app/common/services/server-image.service';


@Component({
    selector: 'wii-server-image',
    templateUrl: 'server-image.component.html',
    styleUrls: ['./server-image.component.scss']
})
export class ServerImageComponent implements OnInit, OnDestroy {
    @Input()
    public backup: string;

    @Input()
    public alt: string;

    @Input()
    public key: ServerImageKeyEnum;

    public src: string;

    private imageSubscription: Subscription;

    private static readonly BACKUPS = {
        [ServerImageKeyEnum.HEADER_IMAGE_KEY]: 'assets/images/followgt_bg_transparent.svg',
        [ServerImageKeyEnum.LOGIN_IMAGE_KEY]: 'assets/images/followgt.svg'
    }

    public constructor(private apiService: ApiService,
                       private serverImageService: ServerImageService,
                       private domSanitizer: DomSanitizer) {
    }

    public ngOnInit(): void {
        const backup = ServerImageComponent.BACKUPS[this.key];
        this.src = this.serverImageService.get(this.key);

        this.unsubscribeImage();
        this.imageSubscription = this.apiService
            .requestApi('get', ApiService.GET_SERVER_IMAGES, {params: {key: this.key}})
            .subscribe(
                ({success, image}) => {
                    if (success && image) {
                        this.src = this.domSanitizer.sanitize(SecurityContext.RESOURCE_URL, this.domSanitizer.bypassSecurityTrustResourceUrl(image));
                        this.serverImageService.saveOneToStorage(this.key, this.src);
                    }
                    else {
                        this.src = backup;
                    }
                },
                () => {
                    this.src = backup;
                }
            );
    }

    public ngOnDestroy(): void {
        this.unsubscribeImage();
    }

    private unsubscribeImage() {
        if (this.imageSubscription) {
            this.imageSubscription.unsubscribe();
            this.imageSubscription = undefined;
        }
    }

}
