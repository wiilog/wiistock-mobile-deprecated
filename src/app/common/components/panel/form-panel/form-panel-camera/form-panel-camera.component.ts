import {Component, EventEmitter, Input, Output} from '@angular/core';
import {take} from 'rxjs/operators';
import {from} from 'rxjs';
import {Camera, CameraOptions} from '@ionic-native/camera/ngx';
import {FormPanelCameraConfig} from '@app/common/components/panel/model/form-panel/form-panel-camera-config';


@Component({
    selector: 'wii-form-panel-camera',
    templateUrl: 'form-panel-camera.component.html',
    styleUrls: ['./form-panel-camera.component.scss']
})
export class FormPanelCameraComponent {

    private readonly cameraOptions: CameraOptions;

    @Input()
    public inputConfig: FormPanelCameraConfig;

    @Input()
    public value?: string;

    @Input()
    public label: string;

    @Input()
    public name: string;

    @Input()
    public errors?: { [errorName: string]: string };

    @Output()
    public valueChange: EventEmitter<string>;

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

    public onItemClicked(): void {
        from(this.camera.getPicture(this.cameraOptions))
            .pipe(take(1))
            .subscribe(
                (imageData: string) => {
                    this.value = imageData ? `data:image/jpeg;base64,${imageData}` : undefined;
                    this.valueChange.emit(this.value);
                },
                (err) => {
                    this.valueChange.emit(undefined);
                }
            );
    }
}
