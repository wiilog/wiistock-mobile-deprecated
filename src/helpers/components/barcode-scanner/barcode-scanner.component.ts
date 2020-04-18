import {Component, EventEmitter, HostBinding, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {ToastService} from "@app/services/toast.service";
import {Subscription} from "rxjs";
import {BarcodeScannerModeEnum} from "@helpers/components/barcode-scanner/barcode-scanner-mode.enum";


@Component({
    selector: 'wii-barcode-scanner',
    templateUrl: 'barcode-scanner.component.html'
})
export class BarcodeScannerComponent implements OnInit, OnDestroy {

    public readonly WITH_MANUAL_MODE = BarcodeScannerModeEnum.WITH_MANUAL;
    public readonly TOOL_SEARCH_MODE = BarcodeScannerModeEnum.TOOL_SEARCH;
    public readonly TOOLS_FULL_MODE = BarcodeScannerModeEnum.TOOLS_FULL;

    public input: string;

    @Input()
    public hidden?: boolean;

    @Input()
    public buttonSubtitle?: string;

    @Input()
    public mode?: BarcodeScannerModeEnum = BarcodeScannerModeEnum.ONLY_SCAN;

    @Output()
    public add: EventEmitter<[string, boolean]>;

    @Output()
    public search: EventEmitter<undefined>;

    @Output()
    public createForm: EventEmitter<undefined>;

    public zebraScanSubscription: Subscription;

    public constructor(private barcodeScannerManager: BarcodeScannerManagerService,
                       private toastService: ToastService) {
        this.add = new EventEmitter<[string, boolean]>();
        this.search = new EventEmitter<undefined>();
        this.createForm = new EventEmitter<undefined>();
    }

    public ngOnInit(): void {
        this.fireZebraScan();
    }

    public ngOnDestroy(): void {
        this.unsubscribeZebraScan();
    }

    public scan(): void {
        this.barcodeScannerManager.scan().subscribe((barcode) => {
            this.triggerAdd(barcode, false);
        });
    }

    public addManually() {
        if (this.input) {
            this.triggerAdd(this.input, true);
            this.clear();
        }
        else {
            this.toastService.presentToast('Aucune donnée saisie');
        }
    }

    public get isScanning(): boolean {
        return !this.barcodeScannerManager.canGoBack;
    }

    public fireZebraScan(): void {
        this.unsubscribeZebraScan();
        this.zebraScanSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode) => {
            this.triggerAdd(barcode, false);
        });
    }

    public unsubscribeZebraScan(): void {
        if (this.zebraScanSubscription) {
            this.zebraScanSubscription.unsubscribe();
            this.zebraScanSubscription = undefined;
        }
    }

    public onSearchClick() {
        this.search.emit();
    }

    public onPenClick() {
        this.createForm.emit();
    }

    private clear(): void {
        this.input = '';
    }

    private triggerAdd(barcode: string, isManual: boolean): void {
        if (!this.hidden) {
            this.add.emit([barcode, isManual]);
        }
    }

    @HostBinding('attr.hidden')
    public get attrHidden(): string {
        return this.hidden ? '' : undefined;
    }
}
