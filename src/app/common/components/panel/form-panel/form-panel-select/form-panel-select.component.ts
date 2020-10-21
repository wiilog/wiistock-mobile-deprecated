import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {SearchItemComponent} from '@app/common/components/select-item/search-item/search-item.component';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';
import {FormPanelItemComponent} from '@app/common/components/panel/model/form-panel/form-panel-item.component';
import {FormPanelSelectConfig} from '@app/common/components/panel/model/form-panel/configs/form-panel-select-config';


@Component({
    selector: 'wii-form-panel-select',
    templateUrl: 'form-panel-select.component.html',
    styleUrls: ['./form-panel-select.component.scss']
})
export class FormPanelSelectComponent implements FormPanelItemComponent<FormPanelSelectConfig> {

    private static readonly MULTIPLE_SEPARATOR: string = ';'

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
    public value?: string;

    @Output()
    public valueChange: EventEmitter<number>;

    public text?: string;

    public constructor() {
        this.valueChange = new EventEmitter<number>();
    }

    private static ValueToText(value: any) {
        return Array.isArray(value)
            ? value.map(({label}) => label).join(FormPanelSelectComponent.MULTIPLE_SEPARATOR)
            : value.label
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

    public onValueChange(value: any) {
        this.valueChange.emit(value);
    }

    public get error(): string {
        const errorsKeys = !this.value && this.inputConfig.required
            ? ['required']
            : [];
        return (errorsKeys.length > 0)
            ? this.errors[errorsKeys[0]]
            : undefined;
    }

    public onItemSelect(itemSelected: {id: string|number; label: string;}) {
        if (itemSelected
            && (!Array.isArray(itemSelected) || itemSelected.length > 0)) {
            const value: Array<any> = !Array.isArray(itemSelected) ? [itemSelected] : itemSelected;
            this.text = FormPanelSelectComponent.ValueToText(itemSelected);
            this.value = value.map(({id}) => id).join(FormPanelSelectComponent.MULTIPLE_SEPARATOR);
        }
        else {
            this.text = undefined;
            this.value = undefined;
        }
        this.onValueChange(this.value);
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
            const value: Array<any> = !Array.isArray(this.value) ? [this.value] : this.value;
            const selected = this.searchComponent ? value.map((val) => this.searchComponent.findItem(val, 'id')) : [];
            if (selected.length > 0) {
                this.text = FormPanelSelectComponent.ValueToText(selected);
            } else if (!this.searchComponent) {
                let valueArray = value.map((arrayValue) => {
                    if (typeof arrayValue !== 'object') {
                        return {
                            id: arrayValue,
                            label: arrayValue
                        };
                    } else {
                        return arrayValue;
                    }
                })
                this.onItemSelect(<any>valueArray);
            }
        }
    }
}
