import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {SearchItemComponent} from '@helpers/components/select-item/search-item/search-item.component';
import {ToastService} from '@app/services/toast.service';
import {BarcodeScannerComponent} from '@helpers/components/barcode-scanner/barcode-scanner.component';
import {BarcodeScannerModeEnum} from "@helpers/components/barcode-scanner/barcode-scanner-mode.enum";
import {SelectItemTypeEnum} from "@helpers/components/select-item/select-item-type.enum";


@Component({
    selector: 'wii-select-item',
    templateUrl: 'select-item.component.html'
})
export class SelectItemComponent {

    @Input()
    public type: SelectItemTypeEnum;

    @Input()
    public scanMode: BarcodeScannerModeEnum;

    @Input()
    public checkBarcodeValidity?: boolean = false;

    @Input()
    public requestParams?: Array<string> = [];

    @Output()
    public itemChange: EventEmitter<any>;

    @Output()
    public createItem: EventEmitter<boolean>;

    @ViewChild('searchComponent')
    public searchComponent: SearchItemComponent;

    @ViewChild('barcodeScanner')
    public barcodeScanner: BarcodeScannerComponent;

    public readonly config = {
        [SelectItemTypeEnum.ARTICLE_TO_PICK]: {
            invalidMessage: 'L\'article scanné n\'est pas présent dans la liste',
            buttonSubtitle: 'Article'
        },
        [SelectItemTypeEnum.LOCATION]: {
            invalidMessage: 'Veuillez flasher ou sélectionner un emplacement',
            buttonSubtitle: 'Emplacement'
        }
    }

    public constructor(private toastService: ToastService) {
        this.itemChange = new EventEmitter<any>();
        this.createItem = new EventEmitter<boolean>();
    }

    public onItemSelect(item: any) {
        this.itemChange.emit(item);
    }

    public onPenClick(): void {
        this.createItem.emit(true);
    }

    public openSearch(): void {
        this.searchComponent.itemComponent.open();
    }

    public testIfBarcodeValid(barcode: string): void {
        if (barcode) {
            let item = this.searchComponent.isKnownItem(barcode);
            if (!item) {
                if (this.scanMode === BarcodeScannerModeEnum.TOOL_SEARCH || this.checkBarcodeValidity) {
                    this.presentInvalidItemToast();
                }
                else {
                    this.onItemSelect({
                        id: new Date().getUTCMilliseconds(),
                        label: barcode
                    });
                }
            }
            else {
                this.onItemSelect(item);
            }
        }
        else {
            this.presentInvalidItemToast();
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

    private presentInvalidItemToast(): void {
        this.toastService.presentToast(
            this.config[this.type].invalidMessage
        );
    }
}
