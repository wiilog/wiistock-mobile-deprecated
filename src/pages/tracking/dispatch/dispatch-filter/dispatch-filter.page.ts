import {Component, ViewChild} from '@angular/core';
import {NavService} from '@app/common/services/nav/nav.service';
import {PageComponent} from '@pages/page.component';

@Component({
    selector: 'wii-filter-validate',
    templateUrl: './dispatch-filter.page.html',
    styleUrls: ['./dispatch-filter.page.scss'],
})
export class DispatchFilterPage extends PageComponent {

    private afterValidate: () => void;

    public constructor(navService: NavService) {
        super(navService);
    }


    public ionViewWillEnter(): void {
        this.afterValidate = this.currentNavParams.get('afterValidate');
    }


    public ionViewWillLeave(): void {

    }

    public validate() {
        this.navService.pop().subscribe(() => {
            this.afterValidate();
        })
    }
}
