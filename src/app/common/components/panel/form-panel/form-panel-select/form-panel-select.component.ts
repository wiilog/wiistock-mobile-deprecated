import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {FormPanelSelectConfig} from '@app/common/components/panel/model/form-panel/form-panel-select-config';
import {SearchItemComponent} from '@app/common/components/select-item/search-item/search-item.component';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';


@Component({
    selector: 'wii-form-panel-select',
    templateUrl: 'form-panel-select.component.html',
    styleUrls: ['./form-panel-select.component.scss']
})
export class FormPanelSelectComponent {

    @ViewChild('searchComponent', {static: false})
    public searchComponent: SearchItemComponent;

    @ViewChild('barcodeScanner', {static: false})
    public barcodeScanner: BarcodeScannerComponent;

    @Input()
    public inputConfig: FormPanelSelectConfig;

    @Input()
    public label: string;

    @Input()
    public name: string;

    @Input()
    public errors?: {[errorName: string]: string};

    @Input()
    public value?: number;

    @Output()
    public valueChange: EventEmitter<string>;

    public text?: string;

    public constructor() {
        this.valueChange = new EventEmitter<string>();
    }

    public fireZebraScan(): void {
        if (this.barcodeScanner) {
            this.barcodeScanner.fireZebraScan();
        }
    }

    public unsubscribeZebraScan() {
        if (this.barcodeScanner) {
            this.barcodeScanner.unsubscribeZebraScan();
        }
    }

    public onValueChange(value: string) {
        this.valueChange.emit(value);
    }

    public get error(): string {
        const errorsKeys = this.value
            ? []
            : ['required'];
        return (errorsKeys.length > 0)
            ? this.errors[errorsKeys[0]]
            : undefined;
    }

    public onItemSelect(itemSelected: {id: number; label: string;}) {
        if (itemSelected) {
            this.text = itemSelected.label;
            this.value = itemSelected.id;
        }
        else {
            this.text = undefined;
            this.value = undefined;
        }
    }

    public onSearchClick() {
        this.searchComponent.itemComponent.open();
    }

    public onBarcodeScanned(barcode): void {
        const item = this.searchComponent.findItem(barcode);
        if (item) {
            this.searchComponent.item = item;
            this.onItemSelect(item);
        }
    }

    public initText(): void {
        if (this.value) {
            const selected = this.searchComponent.findItem(this.value, 'id');
            if (selected) {
                this.text = selected.label;
            }
        }
    }


}
