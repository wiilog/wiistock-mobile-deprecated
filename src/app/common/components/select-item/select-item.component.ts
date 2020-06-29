import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import {ToastService} from '@app/common/services/toast.service';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {SearchItemComponent} from '@app/common/components/select-item/search-item/search-item.component';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';
import {Observable, Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';


@Component({
    selector: 'wii-select-item',
    templateUrl: 'select-item.component.html',
    styleUrls: ['./select-item.component.scss']
})
export class SelectItemComponent implements AfterViewInit, OnDestroy {

    @Input()
    public type: SelectItemTypeEnum;

    @Input()
    public scanMode: BarcodeScannerModeEnum;

    @Input()
    public checkBarcodeValidity?: boolean = false;

    @Input()
    public requestParams?: Array<string> = [];

    @Input()
    public resetEmitter?: Observable<void>;

    @Output()
    public itemChange: EventEmitter<any>;

    @Output()
    public createItem: EventEmitter<boolean>;

    @ViewChild('searchComponent', {static: false})
    public searchComponent: SearchItemComponent;

    @ViewChild('barcodeScanner', {static: false})
    public barcodeScanner: BarcodeScannerComponent;

    private resetEmitterSubscription: Subscription;

    public readonly config = {
        [SelectItemTypeEnum.DEMANDE_LIVRAISON_TYPE]: {
            invalidMessage: 'Le type scanné n\'est pas présent dans la liste',
            buttonSubtitle: 'Type'
        },
        [SelectItemTypeEnum.DEMANDE_LIVRAISON_ARTICLES]: {
            invalidMessage: 'L\'article scanné n\'est pas présent dans la liste',
            buttonSubtitle: 'Article'
        },
        [SelectItemTypeEnum.ARTICLE_TO_PICK]: {
            invalidMessage: 'L\'article scanné n\'est pas présent dans la liste',
            buttonSubtitle: 'Article'
        },
        [SelectItemTypeEnum.LOCATION]: {
            invalidMessage: 'Veuillez flasher ou sélectionner un emplacement connu',
            buttonSubtitle: 'Emplacement'
        },
        [SelectItemTypeEnum.INVENTORY_LOCATION]: {
            invalidMessage: 'L\'emplacement scanné n\'est pas dans la liste',
            buttonSubtitle: 'Emplacement'
        },
        [SelectItemTypeEnum.INVENTORY_ARTICLE]: {
            invalidMessage: 'L\'article scanné n\'est pas dans la liste',
            buttonSubtitle: 'Article'
        },
        [SelectItemTypeEnum.INVENTORY_ANOMALIES_LOCATION]: {
            invalidMessage: 'L\'emplacement scanné n\'est pas dans la liste',
            buttonSubtitle: 'Emplacement'
        },
        [SelectItemTypeEnum.INVENTORY_ANOMALIES_ARTICLE]: {
            invalidMessage: 'L\'article scanné n\'est pas dans la liste',
            buttonSubtitle: 'Article'
        }
    }

    public constructor(private toastService: ToastService,
                       private changeDetector: ChangeDetectorRef) {
        this.itemChange = new EventEmitter<any>();
        this.createItem = new EventEmitter<boolean>();
    }

    public ngAfterViewInit() {
        if (this.resetEmitter) {
            this.resetEmitterSubscription = this.resetEmitter
                .pipe(filter(() => Boolean(this.searchComponent)))
                .subscribe(() => {
                    this.searchComponent.clear();
                    this.changeDetector.detectChanges();
                });
        }
    }

    public ngOnDestroy(): void {
        if (this.resetEmitterSubscription) {
            this.resetEmitterSubscription.unsubscribe();
            this.resetEmitterSubscription = undefined;
        }
    }

    public get dbItemsLength(): number {
        return this.searchComponent.dbItemsLength;
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
            let item = this.searchComponent.findItem(barcode);
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
