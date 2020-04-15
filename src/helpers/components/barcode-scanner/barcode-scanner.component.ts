import {Component, EventEmitter, Input, Output} from '@angular/core';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {ToastService} from "@app/services/toast.service";


@Component({
    selector: 'wii-barcode-scanner',
    templateUrl: 'barcode-scanner.component.html'
})
export class BarcodeScannerComponent {

    public input: string;

    @Input()
    public buttonSubtitle?: string;

    @Input()
    public onlyScan?: boolean = false;

    @Output()
    public add: EventEmitter<[string, boolean]> = new EventEmitter();

    public constructor(private barcodeScannerManager: BarcodeScannerManagerService,
                       private toastService: ToastService) {}

    public scan(): void {
        this.barcodeScannerManager.scan().subscribe((barcode) => {
            this.add.emit([barcode, false]);
        });
    }

    public addManually() {
        if (this.input) {
            this.add.emit([this.input, true]);
            this.clear()
        }
        else {
            this.toastService.presentToast('Aucune donnée saisie');
        }
    }

    public get isScanning(): boolean {
        return !this.barcodeScannerManager.canGoBack;
    }

    private clear(): void {
        this.input = '';
    }
}
