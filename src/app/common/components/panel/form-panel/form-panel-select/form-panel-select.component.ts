import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {FormPanelSelectConfig} from '@app/common/components/panel/model/form-panel/form-panel-select-config';
import {SearchItemComponent} from '@app/common/components/select-item/search-item/search-item.component';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';


@Component({
    selector: 'wii-form-panel-select',
    templateUrl: 'form-panel-select.component.html',
    styleUrls: ['./form-panel-select.component.scss']
})
export class FormPanelSelectComponent implements OnInit, OnDestroy {

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
    public values: Array<{id: number; text: string;}>;

    @Input()
    public errors?: {[errorName: string]: string};

    @Output()
    public valueChange: EventEmitter<string>;

    public text?: string;

    private _value?: number;

    public constructor() {
        this.valueChange = new EventEmitter<string>();
    }

    public ngOnInit(): void {
        if (this.barcodeScanner) {
            this.barcodeScanner.fireZebraScan();
        }
    }

    public ngOnDestroy() {
        if (this.barcodeScanner) {
            this.barcodeScanner.unsubscribeZebraScan();
        }
    }

    @Input()
    public set value(value: number) {
        if (value) {
            this._value = value;
            if (this.values) {
                const selected = this.values.find(({id}) => (id === value));
                if (selected) {
                    this.text = selected.text;
                }
            }
        }
    };

    public get value(): number {
        return this._value;
    };

    public onValueChange(value: string) {
        this.valueChange.emit(value);
    }

    public get error(): string {
        const errorsKeys = this._value
            ? []
            : ['required'];
        return (errorsKeys.length > 0)
            ? this.errors[errorsKeys[0]]
            : undefined;
    }

    public onItemSelect(itemSelected: {id: number; label: string;}) {
        if (itemSelected) {
            this.text = itemSelected.label;
            this._value = itemSelected.id;
        }
        else {
            this.text = undefined;
            this._value = undefined;
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
}
