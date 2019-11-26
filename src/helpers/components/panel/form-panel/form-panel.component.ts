import {Component, Input, QueryList, ViewChildren} from "@angular/core";
import {FormPanelInputConfig} from '../model/form-panel/form-panel-input-config';
import {FormPanelItemConfig} from "../model/form-panel/form-panel-item-config";
import {FormPanelItemComponent} from "../model/form-panel/form-panel-item-component";
import {HeaderConfig} from "@helpers/components/panel/model/header-config";


@Component({
    selector: 'wii-form-panel',
    templateUrl: 'form-panel.component.html'
})
export class FormPanelComponent {
    @Input()
    public header: HeaderConfig;

    @Input()
    public body: Array<FormPanelItemConfig<FormPanelInputConfig>>;

    @ViewChildren('formElement')
    public formElements: QueryList<FormPanelItemComponent<any>>;

    public get values(): {[name: string]: any} {
        return this.formElements
            ? this.formElements.reduce((acc, element: FormPanelItemComponent<any>) => ({
                ...acc,
                name: element.value
            }), {})
            : {};
    }

    public get firstError(): string {
        return this.formElements
            ? this.formElements.reduce(
                (error: string, element: FormPanelItemComponent<any>) => (error ? error : element.error),
                undefined
            )
            : undefined;
    }

}
