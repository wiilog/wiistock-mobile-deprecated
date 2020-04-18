import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {Emplacement} from '@app/entities/emplacement';
import {SearchLocationComponent} from '@helpers/components/search-location/search-location.component';
import {ToastService} from '@app/services/toast.service';
import {BarcodeScannerComponent} from '@helpers/components/barcode-scanner/barcode-scanner.component';
import {BarcodeScannerModeEnum} from "@helpers/components/barcode-scanner/barcode-scanner-mode.enum";


@Component({
    selector: 'wii-select-location',
    templateUrl: 'select-location.component.html'
})
export class SelectLocationComponent {

    @Input()
    public scanMode: BarcodeScannerModeEnum;

    @Input()
    public checkBarcodeValidity?: boolean = false;

    @Input()
    public location?: Emplacement;

    @Output()
    public locationChange: EventEmitter<Emplacement>;

    @Output()
    public createLocation: EventEmitter<boolean>;

    @ViewChild('searchComponent')
    public searchComponent: SearchLocationComponent;

    @ViewChild('barcodeScanner')
    public barcodeScanner: BarcodeScannerComponent;

    public constructor(private toastService: ToastService) {
        this.locationChange = new EventEmitter<Emplacement>();
        this.createLocation = new EventEmitter<boolean>();
    }

    public onLocationChange(location: Emplacement) {
        this.location = location;
        this.locationChange.emit(location);
    }

    public onPenClick(): void {
        this.createLocation.emit(true);
    }

    public openSearch(): void {
        this.searchComponent.locationComponent.open();
    }

    public testIfBarcodeValid(barcode: string): void {
        if (barcode) {
            let location = this.searchComponent.isKnownLocation(barcode);
            if (!location) {
                if (this.scanMode === BarcodeScannerModeEnum.TOOL_SEARCH || this.checkBarcodeValidity) {
                    this.toastService.presentToast('Veuillez flasher ou sélectionner un emplacement connu');
                }
                else {
                    this.onLocationChange({
                        id: new Date().getUTCMilliseconds(),
                        label: barcode
                    });
                }
            }
            else {
                this.onLocationChange(location);
            }
        }
        else {
            this.toastService.presentToast('Veuillez flasher ou sélectionner un emplacement');
        }
    }

    public get isScanning(): boolean {
        return this.barcodeScanner.isScanning;
    }

    public fireZebraScan(): void {
        return this.barcodeScanner.fireZebraScan();
    }

    public unsubscribeZebraScan(): void {
        return this.barcodeScanner.unsubscribeZebraScan();
    }
}
