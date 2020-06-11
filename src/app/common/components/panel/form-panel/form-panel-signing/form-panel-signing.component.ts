import {Component, EventEmitter, Input, OnDestroy, Output} from '@angular/core';
import {LoadingService} from '@app/common/services/loading.service';
import {map} from 'rxjs/operators';
import {ModalController} from '@ionic/angular';
import {from} from 'rxjs';
import {SignaturePadComponent} from '@app/common/components/signature-pad/signature-pad.component';
import {FormPanelSigningConfig} from '@app/common/components/panel/model/form-panel/form-panel-signing-config';


@Component({
    selector: 'wii-form-panel-signing',
    templateUrl: 'form-panel-signing.component.html',
    styleUrls: [
        './form-panel-signing.component.scss'
    ]
})
export class FormPanelSigningComponent implements OnDestroy {

    @Input()
    public inputConfig: FormPanelSigningConfig;

    @Input()
    public value?: string;

    @Input()
    public label: string;

    @Input()
    public name: string;

    @Input()
    public errors?: {[errorName: string]: string};

    @Output()
    public valueChange: EventEmitter<string>;

    private destroyed: boolean;

    public constructor(private modalController: ModalController,
                       private loadingService: LoadingService) {
        this.valueChange = new EventEmitter<string>();
        this.destroyed = false;
    }

    public get error(): string {
        return !this.value
            ? (this.errors && this.errors.required)
            : undefined;
    }

    public onItemClicked(): void {
        // we wait for the keyboard to finish hiding
        setTimeout(() =>  {
            this.loadingService
                .presentLoading()
                .pipe(
                    map((loading) => from(loading.dismiss()))
                )
                .subscribe(() => {
                    if (!this.destroyed) {
                        from(this.modalController.create({
                            component: SignaturePadComponent,
                            componentProps: {
                                signature: this.value
                            },
                            showBackdrop: true
                        })).subscribe((modal: HTMLIonModalElement) => {
                            modal.onDidDismiss().then((returnedData) => {
                                const data = returnedData && returnedData.data;
                                if (data && (data.signature === false || data.signature)) {
                                    this.value = data.signature
                                        ? data.signature // not false
                                        : undefined; // if false we delete previous image
                                    this.valueChange.emit(this.value);
                                }
                            });
                            modal.present();
                        });

                    }
                });
        }, 400);
    }

    public ngOnDestroy(): void {
        this.destroyed = true;
    }
}
