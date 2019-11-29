import {Component, EventEmitter, Input, Output, ViewChild} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";


@Component({
    selector: 'wii-icon',
    templateUrl: 'icon.component.html'
})
export class IconComponent {

    private static readonly ICONS_DIRECTORY: string = 'assets/icons';

    @ViewChild('button')
    public button: HTMLButtonElement;

    @Input()
    public class?: string;

    // color declared in variables.scss
    @Input()
    public color?: 'primary'|'secondary'|'danger'|'light'|'dark'|'grey'|'green'|'white';

    @Output()
    public action;

    public svgObject: SafeHtml;

    private _name: string;

    public constructor(private httpClient: HttpClient,
                       private sanitizer: DomSanitizer) {
        this.action = new EventEmitter<any>();
    }

    @Input()
    public set name(name: string) {
        if (this._name !== name) {
            this._name = name;
            this.httpClient.get(this.src, {responseType: "text"}).subscribe((svg) => {
                this.svgObject = this.sanitizer.bypassSecurityTrustHtml(svg);
            });
        }
    }

    public onButtonClick(event: Event) {
        this.action.emit(event)
    }

    public get src(): string {
        return `${IconComponent.ICONS_DIRECTORY}/${this._name}`;
    }
}
