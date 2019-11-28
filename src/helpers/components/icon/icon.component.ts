import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";


@Component({
    selector: 'wii-icon',
    templateUrl: 'icon.component.html'
})
export class IconComponent implements OnInit {

    private static readonly ICONS_DIRECTORY: string = 'assets/icons';
    private static readonly DEFAULT_SVG_COLOR_ATTRIBUTE = 'fill';

    // color declared in variables.scss
    @Input()
    public color?: 'primary'|'secondary'|'danger'|'light'|'dark'|'grey'|'green'|'white';

    @Input()
    public svgColorAttribute?: 'fill'|'stroke';

    @Output()
    public action: EventEmitter<any>;

    public svgObject$: Observable<SafeHtml>;

    private _name: string;

    public constructor(private httpClient: HttpClient,
                       private sanitizer: DomSanitizer) {
        this.action = new EventEmitter<any>();
        this.svgColorAttribute = 'fill';
    }

    public ngOnInit(): void {
        this.svgColorAttribute = this.svgColorAttribute || IconComponent.DEFAULT_SVG_COLOR_ATTRIBUTE;
    }

    @Input()
    public set name(name: string) {
        if (this._name !== name) {
            this._name = name;
            this.svgObject$ = this.httpClient
                .get(this.src, {responseType: "text"})
                .pipe(map((svg) => this.sanitizer.bypassSecurityTrustHtml(svg)));
        }
    }

    public onButtonClick(event: Event) {
        this.action.emit(event)
    }

    public get src(): string {
        return `${IconComponent.ICONS_DIRECTORY}/${this._name}`;
    }
}
