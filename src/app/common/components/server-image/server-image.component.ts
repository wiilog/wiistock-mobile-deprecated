import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ServerImageKeyEnum} from '@app/common/components/server-image/server-image-key.enum';
import {ApiService} from '@app/common/services/api.service';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {StorageService} from '@app/common/services/storage/storage.service';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {of, Subscription} from 'rxjs';
import {catchError, flatMap, tap} from 'rxjs/operators';


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

    public src: SafeResourceUrl;

    private imageSubscription: Subscription;

    private static readonly BACKUPS = {
        [ServerImageKeyEnum.HEADER_IMAGE_KEY]: 'assets/images/followgt_bg_transparent.svg',
        [ServerImageKeyEnum.LOGIN_IMAGE_KEY]: 'assets/images/followgt.svg'
    }

    private static readonly CACHE_KEY = {
        [ServerImageKeyEnum.HEADER_IMAGE_KEY]: StorageKeyEnum.IMAGE_SERVER_HEADER,
        [ServerImageKeyEnum.LOGIN_IMAGE_KEY]: StorageKeyEnum.IMAGE_SERVER_LOGIN
    }

    public constructor(private apiService: ApiService,
                       private storageService: StorageService,
                       private domSanitizer: DomSanitizer) {
    }

    public ngOnInit(): void {
        const backup = ServerImageComponent.BACKUPS[this.key];
        const cacheKey = ServerImageComponent.CACHE_KEY[this.key];
        this.src = backup;

        this.unsubscribeImage();
        this.imageSubscription = this.storageService.getItem(cacheKey)
            .pipe(
                tap((cachedImage) => {
                    if (cachedImage) {
                        this.src = cachedImage;
                    }
                }),
                catchError(() => {
                    return of(undefined);
                }),
                flatMap(() => this.apiService.requestApi('get', ApiService.GET_SERVER_IMAGES, {params: {key: this.key}}))
            )
            .subscribe(
                ({success, image}) => {
                    if (success && image) {
                        this.src = this.domSanitizer.bypassSecurityTrustResourceUrl(image);
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
