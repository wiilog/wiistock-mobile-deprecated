import {Component} from '@angular/core';
import {Platform, ViewWillEnter} from '@ionic/angular';
import {PageComponent} from '@pages/page.component';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {NetworkService} from '@app/common/services/network.service';
import {ToastService} from '@app/common/services/toast.service';
import {StorageService} from '@app/common/services/storage/storage.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {TranslationService} from '@app/common/services/translations.service';
import {NavService} from '@app/common/services/nav/nav.service';

@Component({
    selector: 'wii-transport-round-list',
    templateUrl: './transport-round-list.page.html',
    styleUrls: ['./transport-round-list.page.scss'],
})
export class TransportRoundListPage extends PageComponent implements ViewWillEnter {

    public constructor(navService: NavService) {
        super(navService);
    }

}
