import {ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';
import {ApiService} from '@app/common/services/api.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {ToastService} from '@app/common/services/toast.service';
import {LoadingService} from '@app/common/services/loading.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {TrackingListFactoryService} from '@app/common/services/tracking-list-factory.service';
import {StorageService} from '@app/common/services/storage/storage.service';
import {ActivatedRoute} from '@angular/router';
import {NavService} from '@app/common/services/nav/nav.service';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {PageComponent} from '@pages/page.component';
import {TranslationService} from '@app/common/services/translations.service';
import {AlertService} from '@app/common/services/alert.service';
import {NetworkService} from '@app/common/services/network.service';
import {from, Observable, zip} from 'rxjs';
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {ListPanelItemConfig} from "@app/common/components/panel/model/list-panel/list-panel-item-config";
import {IconConfig} from "@app/common/components/panel/model/icon-config";
import {flatMap, map, tap} from "rxjs/operators";
import {NavPathEnum} from "@app/common/services/nav/nav-path.enum";
import {CardListConfig} from "@app/common/components/card-list/card-list-config";
import {Livraison} from "@entities/livraison";


@Component({
    selector: 'wii-prise',
    templateUrl: './article-creation.page.html',
    styleUrls: ['./article-creation.page.scss'],
})
export class ArticleCreationPage extends PageComponent implements CanLeave {

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.ONLY_MANUAL;
    public loading: boolean = false;
    public defaultLocation: string = '';
    public headerConfig?: {
        leftIcon: IconConfig;
        title: string;
        subtitle?: string;
    };

    public constructor(private networkService: NetworkService,
                       private apiService: ApiService,
                       private sqliteService: SqliteService,
                       private alertService: AlertService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private changeDetectorRef: ChangeDetectorRef,
                       private localDataManager: LocalDataManagerService,
                       private trackingListFactory: TrackingListFactoryService,
                       private activatedRoute: ActivatedRoute,
                       private storageService: StorageService,
                       private translationService: TranslationService,
                       navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.loading = true;
        this.loadingService.presentLoadingWhile({
            event: () => {
                return this.apiService
                    .requestApi(ApiService.DEFAULT_LOCATION_ARTICLE_CREATION)
            }
        }).subscribe(({location}) => {
                this.defaultLocation = location;
                this.headerConfig = {
                    leftIcon: {
                        name: 'transfer.svg',
                        color: 'tertiary'
                    },
                    title: `Balayer étiquette RFID`,
                    subtitle: `Emplacement : ${this.defaultLocation}`
                }
                this.loading = false;
            })
    }

    public ionViewWillLeave(): void {
        this.footerScannerComponent.unsubscribeZebraScan();
    }

    wiiCanLeave(): boolean | Observable<boolean> {
        return true;
    }

    public scan(value) {
        this.loading = true;
        this.loadingService.presentLoadingWhile({
            event: () => {
                return this.apiService
                    .requestApi(ApiService.GET_ARTICLE_BY_RFID_TAG, {
                        pathParams: {rfid: value},
                    })
            }
        }).subscribe(({article}) => {
                if (article) {
                    this.toastService.presentToast('Article existant.');
                } else {
                    console.log('Create');
                }
                this.loading = false;
            });
        console.log(value);
    }

    public rfid() {
      console.log('RFID')
    }

}
