import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    Output,
    ViewChild
} from '@angular/core';
import {ToastService} from '@app/common/services/toast.service';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {SearchItemComponent} from '@app/common/components/select-item/search-item/search-item.component';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';
import {Observable, Subject, Subscription} from 'rxjs';
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

    public selectedLabel$: Subject<string>;

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
        [SelectItemTypeEnum.STATUS]: {
            invalidMessage: 'Le statut scanné n\'est pas présent dans la liste',
            buttonSubtitle: 'Statut'
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
        this.selectedLabel$ = new Subject<string>();
    }

    public ngAfterViewInit() {
        if (this.resetEmitter) {
            this.resetEmitterSubscription = this.resetEmitter
                .pipe(filter(() => Boolean(this.searchComponent)))
                .subscribe(() => {
                    this.resetSearchComponent();
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
        const labelName = this.searchComponent.config[this.type].label;
        this.selectedLabel$.next((item && labelName) ? item[labelName] : undefined);
        if (!item) {
            this.resetSearchComponent();
        }
    }

    public onPenClick(): void {
        this.createItem.emit(true);
    }

    public openSearch(): void {
        setTimeout(() => {
            if (this.searchComponent
                && this.searchComponent.itemComponent
                && !this.searchComponent.itemComponent.isOpened
                && this.searchComponent.itemComponent.isEnabled) {
                this.searchComponent.itemComponent.open();
            }
        });
    }

    public closeSearch(): void {
        setTimeout(() => {
            if (this.searchComponent
                && this.searchComponent.itemComponent
                && this.searchComponent.itemComponent.isOpened
                && this.searchComponent.itemComponent.isEnabled) {
                this.searchComponent.itemComponent.close();
            }
        });
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
        if (this.barcodeScanner) {
            this.barcodeScanner.fireZebraScan();
        }
    }

    public unsubscribeZebraScan(): void {
        if (this.barcodeScanner) {
            this.barcodeScanner.unsubscribeZebraScan();
        }
    }

    private presentInvalidItemToast(): void {
        this.toastService.presentToast(
            this.config[this.type].invalidMessage
        );
    }

    private resetSearchComponent(): void {
        this.searchComponent.clear();
        this.changeDetector.detectChanges();
    }
}
