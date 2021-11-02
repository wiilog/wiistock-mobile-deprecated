import {Component, EventEmitter, Input, Output} from '@angular/core';
import {take} from 'rxjs/operators';
import {from} from 'rxjs';
import {Camera, CameraOptions} from '@ionic-native/camera/ngx';
import {FormPanelItemComponent} from '@app/common/components/panel/model/form-panel/form-panel-item.component';
import {FormPanelCameraConfig} from '@app/common/components/panel/model/form-panel/configs/form-panel-camera-config';


@Component({
    selector: 'wii-form-panel-camera',
    templateUrl: 'form-panel-camera.component.html',
    styleUrls: ['./form-panel-camera.component.scss']
})
export class FormPanelCameraComponent implements FormPanelItemComponent<FormPanelCameraConfig> {

    private static readonly MAX_MULTIPLE_PHOTO = 10;

    private readonly cameraOptions: CameraOptions;

    @Input()
    public inputConfig: FormPanelCameraConfig;

    @Input()
    public value?: string|Array<string>;

    @Input()
    public label: string;

    @Input()
    public name: string;

    @Input()
    public errors?: { [errorName: string]: string };

    @Input()
    public inline?: boolean;

    @Output()
    public valueChange: EventEmitter<string|Array<string>>;

    public constructor(private camera: Camera) {
        this.valueChange = new EventEmitter<string>();
        this.cameraOptions = {
            quality: 30,
            destinationType: this.camera.DestinationType.DATA_URL,
            encodingType: this.camera.EncodingType.JPEG,
            mediaType: this.camera.MediaType.PICTURE,
            sourceType: this.camera.PictureSourceType.CAMERA
        };
    }

    public get error(): string {
        return (this.inputConfig.required && !this.value)
            ? (this.errors && this.errors.required)
            : undefined;
    }

    public onPhotoClicked(index: number): void {
        if (this.inputConfig.multiple) {
            (this.value as Array<string>).splice(index, 1);
        }
        else {
            this.value = undefined;
        }
    }

    public onItemClicked(): void {
        from(this.camera.getPicture(this.cameraOptions))
            .pipe(take(1))
            .subscribe(
                (imageData: string) => {
                    const value = imageData ? `data:image/jpeg;base64,${imageData}` : undefined;
                    if (this.inputConfig.multiple && imageData) {
                        if (!Array.isArray(this.value)) {
                            if (this.value) {
                                this.value = [this.value];
                            }
                            else {
                                this.value = [];
                            }
                        }
                        this.value.push(value);
                    }
                    else {
                        this.value = imageData ? value : undefined;
                    }
                    this.valueChange.emit(this.value);
                },
                () => {
                    this.valueChange.emit(undefined);
                }
            );
    }

    public get displayCameraButton(): boolean {
        return (
            (
                this.inputConfig.multiple
                && this.value
                && (this.value as Array<string>).length < FormPanelCameraComponent.MAX_MULTIPLE_PHOTO
            )
            || !this.value
        );
    }
}
