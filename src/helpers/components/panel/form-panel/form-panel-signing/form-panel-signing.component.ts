import {Component, EventEmitter, Input, OnDestroy, Output} from "@angular/core";
import {FormPanelItemComponent} from "@helpers/components/panel/model/form-panel/form-panel-item-component";
import {FormPanelInputConfig} from "@helpers/components/panel/model/form-panel/form-panel-input-config";
import {ModalController} from "ionic-angular";
import {SignaturePadComponent} from "@helpers/components/signature-pad/signature-pad.component";
import {LoadingService} from "@app/services/loading.service";
import {map} from "rxjs/operators";
import {from} from "rxjs/observable/from";


@Component({
    selector: 'wii-form-panel-signing',
    templateUrl: 'form-panel-signing.component.html'
})
export class FormPanelSigningComponent implements FormPanelItemComponent<FormPanelInputConfig>, OnDestroy {

    @Input()
    public inputConfig: FormPanelInputConfig;

    @Input()
    public value?: string;

    @Input()
    public label: string;

    @Input()
    public name: string;

    @Input()
    public errors?: {[erroName: string]: string};

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
                        const modal = this.modalController.create(
                            SignaturePadComponent,
                            {signature: this.value},
                            {showBackdrop: true}
                        );
                        modal.onDidDismiss((data) => {
                            if (data && (data.signature === false || data.signature)) {
                                this.value = data.signature
                                    ? data.signature // not false
                                    : undefined; // if false we delete previous image
                                this.valueChange.emit(this.value);
                            }
                        });
                        modal.present();
                    }
                });
        }, 400);
    }

    public ngOnDestroy(): void {
        this.destroyed = true;
    }

}
