import {Injectable} from '@angular/core';

@Injectable()
export class ScssHelperService {
    private static readonly PREFIX: string = '--';
    private static readonly DEFAULT_VALUE: undefined = undefined;

    private style: CSSStyleDeclaration;

    public constructor() {
        this.style = window.getComputedStyle(document.body);
    }

    public getVariable(name: string): string {
        const value = this.style.getPropertyValue(`${ScssHelperService.PREFIX}${name}`);
        const trimmedValue = value ? value.trim() : ScssHelperService.DEFAULT_VALUE;
        return trimmedValue ? trimmedValue : ScssHelperService.DEFAULT_VALUE;
    }
}
