import {Component, Input} from '@angular/core';
import {StatsSlidersData} from '@app/common/components/stats-sliders/stats-sliders-data';

type DataType = Array<StatsSlidersData&{isSingleData?: boolean} | [StatsSlidersData, StatsSlidersData, StatsSlidersData, StatsSlidersData]>;

@Component({
    selector: 'wii-stats-sliders',
    templateUrl: 'stats-sliders.component.html',
    styleUrls: ['./stats-sliders.component.scss']
})
export class StatsSlidersComponent {

    public _data: DataType;

    @Input()
    public set data(data: DataType) {
        this._data = data.map((datum) => (
            Array.isArray(datum)
                ? datum
                : {...datum, isSingleData: true}))
    }

    public get data(): DataType {
        return this._data;
    };

}
