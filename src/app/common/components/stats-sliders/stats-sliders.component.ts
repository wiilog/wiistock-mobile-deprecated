import {Component, Input} from '@angular/core';
import {StatsSlidersData} from '@app/common/components/stats-sliders/stats-sliders-data';


@Component({
    selector: 'wii-stats-sliders',
    templateUrl: 'stats-sliders.component.html',
    styleUrls: ['./stats-sliders.component.scss']
})
export class StatsSlidersComponent {

    @Input()
    public data: Array<StatsSlidersData>;

}
