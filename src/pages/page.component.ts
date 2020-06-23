import {NavService} from '@app/common/services/nav.service';
import {OnDestroy} from '@angular/core';

export abstract class PageComponent implements OnDestroy {
    protected constructor(protected navService: NavService) {}

    public ngOnDestroy(): void {
        //this.navService.removeCurrentParams();
    }
}
