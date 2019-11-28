import {Component, EventEmitter, Input, Output, ViewChild} from "@angular/core";
import {FormPanelItemComponent} from "@helpers/components/panel/model/form-panel/form-panel-item-component";
import {FormPanelInputConfig} from "@helpers/components/panel/model/form-panel/form-panel-input-config";
import {ModalController} from "ionic-angular";
import {SignaturePad} from "angular2-signaturepad/signature-pad";
import {SignaturePadComponent} from "@helpers/components/signature-pad/signature-pad.component";


@Component({
    selector: 'wii-form-panel-signing',
    templateUrl: 'form-panel-signing.component.html'
})
export class FormPanelSigningComponent implements FormPanelItemComponent<FormPanelInputConfig> {

    @ViewChild(SignaturePad)
    public signaturePad: SignaturePad;

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

    public constructor(private modalController: ModalController) {
        this.valueChange = new EventEmitter<string>();
    }


    public onValueChange(value: string) {
        this.valueChange.emit(value);
    }

    public get error(): string {
        // TODO
        // const errorsKeys = Object.keys(this.inputComponent.ngControl.errors || {});
        // return (this.errors && errorsKeys.length > 0)
        //     ? this.errors[errorsKeys[0]]
            return undefined;
    }

    public onItemClicked(): void {
        const modal = this.modalController.create(
            SignaturePadComponent,
            {signature: this.value},
            {showBackdrop: true}
        );
        modal.onDidDismiss((data) => {
            if (data && data.signature) {
                this.value = data.signature
                    ? data.signature // not false
                    : undefined // if false we delete previous image
            }
        });
        modal.present();
    }

}
