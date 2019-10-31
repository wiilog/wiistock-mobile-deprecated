import {Component, ViewChild} from '@angular/core';
import {App, IonicPage, NavController, NavParams} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {Emplacement} from '@app/entities/emplacement';
import {Article} from '@app/entities/article';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ChangeDetectorRef} from '@angular/core';
import {IonicSelectableComponent} from 'ionic-selectable';
import {DeposeArticlesPageTraca} from '@pages/traca/depose-articles/depose-articles-traca';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {ToastService} from '@app/services/toast.service';
import {Subscription} from "rxjs";


@IonicPage()
@Component({
    selector: 'depose-prise',
    templateUrl: 'depose-emplacement-traca.html',
})
export class DeposeEmplacementPageTraca {

    private static readonly INIT_END_INDEX: number = 20;


    @ViewChild('locationComponent')
    public locationComponent: IonicSelectableComponent;
    public emplacement: Emplacement;

    public db_locations: Array<Emplacement>;
    public db_locations_for_list: Array<Emplacement>;
    public db_articles: Array<Article>;

    private endIndex: number;

    private zebraScanSubscription: Subscription;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public app: App,
                       public sqliteProvider: SqliteProvider,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private changeDetectorRef: ChangeDetectorRef,
                       private toastService: ToastService) {
        this.resetEndIndex();
    }

    public ionViewWillEnter(): void {
        this.sqliteProvider.findAll('emplacement').subscribe((value) => {
            this.db_locations = value;
            this.db_locations_for_list = value;
        });

        this.zebraScanSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode: string) => {
            this.testIfBarcodeEquals(barcode);
        })
    }

    public ionViewWillLeave(): void {
        if (this.zebraScanSubscription) {
            this.zebraScanSubscription.unsubscribe();
            this.zebraScanSubscription = undefined;
        }
    }

    public ionViewCanLeave(): boolean {
        return this.barcodeScannerManager.canGoBack;
    }

    goToArticles() {
        if (this.emplacement) {
            this.navCtrl.push(DeposeArticlesPageTraca, {
                emplacement: this.emplacement,
                finishDepose: () => {
                    this.navCtrl.pop();
                }
            });
        }
        else {
            this.toastService.showToast('Veuillez sélectionner un emplacement')
        }
    }

    emplacementChange(event: { component: IonicSelectableComponent, value: any }) {
        this.emplacement = event.value;
    }

    searchEmplacement({text}: { component: IonicSelectableComponent, text: string }) {
        this.locationComponent.showLoading();
        this.changeDetectorRef.detectChanges();

        this.resetEndIndex();
        this.updateLocationForList(text, true);

        this.locationComponent.hideLoading();
        this.changeDetectorRef.detectChanges();
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    scanLocation() {
        this.barcodeScannerManager.scan().subscribe((barcode) => {
            this.testIfBarcodeEquals(barcode)
        });
    }

    testIfBarcodeEquals(barcode) {
        this.sqliteProvider.findAll('`emplacement`').subscribe(resp => {
            let emplacement = resp.find(element => element.label === barcode);
            if (emplacement) {
                this.barcodeScannerManager.wrapZebraUpdate(() => {
                    this.emplacement = emplacement;
                });
            } else {
                this.toastService.showToast('Veuillez flasher ou sélectionner un emplacement connu.');
            }
        });
    }

    getMoreLocations({text, component}: { component: IonicSelectableComponent, text: string }) {
        this.locationComponent.showLoading();
        if (this.endIndex >= this.db_locations.length) {
            component.disableInfiniteScroll();
        }
        else {
            if (this.endIndex + DeposeEmplacementPageTraca.INIT_END_INDEX >= this.db_locations.length) {
                this.endIndex = this.db_locations.length;
            }
            else {
                this.endIndex += DeposeEmplacementPageTraca.INIT_END_INDEX;
            }

            this.updateLocationForList(text);
        }
        component.endInfiniteScroll();
        this.locationComponent.hideLoading();
    }

    private updateLocationForList(text?: string, isSearch: boolean = false): void {
        if (text) {
            const trimmedText = text.trim();
            if (!isSearch || text.length > 2) {
                this.db_locations_for_list = this.db_locations
                    .filter(emplacement => emplacement.label.toLowerCase().includes(trimmedText.toLowerCase()))
                    .slice(0, this.endIndex);
            }
        }
        else {
            this.db_locations_for_list = this.db_locations.slice(0, this.endIndex);
        }
    }

    private resetEndIndex(): void {
        this.endIndex = DeposeEmplacementPageTraca.INIT_END_INDEX;
    }

}
