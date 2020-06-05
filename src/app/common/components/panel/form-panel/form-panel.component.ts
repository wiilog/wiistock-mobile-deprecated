import {Component, Input, QueryList, ViewChildren} from '@angular/core';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {FormPanelItemConfig} from '@app/common/components/panel/model/form-panel/form-panel-item-config';
import {FormPanelItemAvailable} from '@app/common/components/panel/model/form-panel-item-available';
import {FormPanelItemComponent} from '@app/common/components/panel/model/form-panel/form-panel-item-component';


@Component({
    selector: 'wii-form-panel',
    templateUrl: 'form-panel.component.html',
    styleUrls: [
        './form-panel.component.scss'
    ]
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
                [element.name]: element.value
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
