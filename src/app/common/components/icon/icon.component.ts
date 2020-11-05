import {Component, EventEmitter, Input, Output} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {Observable, ReplaySubject} from 'rxjs';
import {map} from 'rxjs/operators';
import {IconColor} from '@app/common/components/icon/icon-color';

/**
 * Step to add svg icon into assets/icons :
 *  * Into svg file : remove all id except id on svg tag
 *  * Rename style classes declaration: .svg-[filename]-[oldClassName] ; exemple for icon.svg        .st0 -> .svg-icon-st0
 *  * on each element add svg-fill or svg-stroke (required to change color with component)
 */
@Component({
    selector: 'wii-icon',
    templateUrl: 'icon.component.html',
    styleUrls: ['./icon.component.scss']
})
export class IconComponent {

    private static readonly ICONS_DIRECTORY: string = 'assets/icons';
    private static IconCounter: number = 0;

    private static readonly IconsCacheObservers: {[name: string]: ReplaySubject<SafeHtml>} = {};

    // color declared in variables.scss
    @Input()
    public color?: IconColor;

    @Input()
    public buttonWithoutRipple?: boolean;

    @Output()
    public action: EventEmitter<Event>;

    public svgObject$: Observable<SafeHtml>;

    private _name: string;

    private readonly id: number;

    private readonly domParser: DOMParser;

    public constructor(private httpClient: HttpClient,
                       private sanitizer: DomSanitizer) {
        this.id = ++IconComponent.IconCounter;
        this.action = new EventEmitter<Event>();
        this.domParser = new DOMParser();
    }

    @Input()
    public set name(name: string) {
        if (this._name !== name) {
            this._name = name;
            if (IconComponent.IconsCacheObservers[this._name]) {
                this.svgObject$ = IconComponent.IconsCacheObservers[this._name];
            }
            else {
                const svgObject$ = new ReplaySubject<SafeHtml>(1);
                this.svgObject$ = svgObject$
                IconComponent.IconsCacheObservers[this._name] = svgObject$;
                this.httpClient
                    .get(this.src, {responseType: "text"})
                    .pipe(
                        map((svgStr: string) => {
                            if (!this.isSvg(svgStr)) {
                                throw Error('IconComponent support svg images only.');
                            }
                            return this.sanitizeSVG(svgStr);
                        })
                    )
                    .subscribe(
                        (sanitizedSVG: SafeHtml) => svgObject$.next(sanitizedSVG),
                        (sanitizedSVG: SafeHtml) => svgObject$.error(sanitizedSVG),
                        () => svgObject$.complete()
                    );
            }
        }
    }

    public onButtonClick(event: Event) {
        this.action.emit(event)
    }

    public get src(): string {
        return `${IconComponent.ICONS_DIRECTORY}/${this._name}`;
    }

    private sanitizeSVG(svgStr: string): SafeHtml {
        const cleanedSvg = this.cleanSVG(svgStr);
        const svgHTML = this.domParser.parseFromString(cleanedSvg, 'text/html');
        const children = svgHTML.body.children;
        for(let childIndex = 0; childIndex < children.length; childIndex++) {
            const svg = children.item(childIndex);
            svg.setAttribute('id', `wii-icon-${this.id}`);
        }
        return this.sanitizer.bypassSecurityTrustHtml(svgHTML.body.innerHTML);
    }

    private isSvg(iconStr: string): boolean {
        return iconStr.includes('<?xml') && iconStr.includes('<svg');
    }

    private cleanSVG(svgStr: string): string {
        return svgStr
            .replace(/^.*<\?xml.*$/mg, "")
            .replace(/^.*<!--.*$/mg, "")
            .trim();
    }

}
