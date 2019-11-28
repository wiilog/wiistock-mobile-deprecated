import {Component, ElementRef, ViewChild} from '@angular/core';
import {NavParams, ViewController} from "ionic-angular";
import {SignaturePad} from "angular2-signaturepad/signature-pad";


@Component({
    selector: 'wii-signature-pad',
    templateUrl: 'signature-pad.component.html'
})
export class SignaturePadComponent {

    public signaturePadOption;

    @ViewChild('signatureWrapper')
    public signatureWrapper: ElementRef;

    @ViewChild(SignaturePad)
    public signaturePad: SignaturePad;

    public constructor(private viewCtrl: ViewController,
                       private navParams: NavParams) {
    }

    public ionViewWillEnter(): void {
        const signature = this.navParams.get('signature');
        const componentSize = this.signatureWrapper.nativeElement.getBoundingClientRect();
        this.signaturePadOption = {
            canvasWidth: componentSize.width,
            canvasHeight: componentSize.height - 4
        };
        setTimeout(() => {
            this.signaturePad.fromDataURL(signature);
        })
    }

    public onValidate(): void {
        this.viewCtrl.dismiss({
            signature: this.signaturePad.isEmpty()
                ? false
                : this.signaturePad.toDataURL('image/png')
        });
    }

    public onPop(): void {
        this.viewCtrl.dismiss({});
    }

    public onClear(): void {
        this.signaturePad.clear();
    }

}
