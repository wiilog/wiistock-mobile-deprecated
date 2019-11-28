import {Component, Input, QueryList, ViewChildren} from '@angular/core';
import {FormPanelItemConfig} from '@helpers/components/panel/model/form-panel/form-panel-item-config';
import {FormPanelItemComponent} from '@helpers/components/panel/model/form-panel/form-panel-item-component';
import {HeaderConfig} from '@helpers/components/panel/model/header-config';
import {FormPanelItemAvailable} from '@helpers/components/panel/model/form-panel-item-available';


@Component({
    selector: 'wii-form-panel',
    templateUrl: 'form-panel.component.html'
})
export class FormPanelComponent {
    @Input()
    public header: HeaderConfig;

    @Input()
    public body: Array<FormPanelItemConfig<FormPanelItemAvailable>>;

    @ViewChildren('formElement')
    public formElements: QueryList<FormPanelItemComponent<FormPanelItemAvailable>>;

    public get values(): {[name: string]: any} {
        return this.formElements
            ? this.formElements.reduce((acc, element: FormPanelItemComponent<FormPanelItemAvailable>) => ({
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
