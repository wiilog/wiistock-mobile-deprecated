import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

export type SimpleCardTitle = {
    title: string;
    image?: string;
    position: `left` | `right`;
}

@Component({
    selector: 'wii-simple-card',
    templateUrl: './simple-card.component.html',
    styleUrls: ['./simple-card.component.scss'],
})
export class SimpleCardComponent implements OnInit {

    @Input()
    public titles: Array<SimpleCardTitle>;

    @Input()
    public color: string;

    @Input()
    public disabled: boolean;

    @Output()
    public click: EventEmitter<void> = new EventEmitter();

    public leftTitles: Array<SimpleCardTitle>;
    public rightTitles: Array<SimpleCardTitle>;

    ngOnInit() {
        this.leftTitles = this.titles.filter(title => title.position === `left`);
        this.rightTitles = this.titles.filter(title => title.position === `right`);
    }

    public onClick(): void {
        if(!this.disabled) {
            this.click.emit();
        }
    }

}
