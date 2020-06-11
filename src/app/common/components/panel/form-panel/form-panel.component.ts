import {AfterViewInit, Component, Input, QueryList, ViewChildren} from '@angular/core';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {FormPanelItemConfig} from '@app/common/components/panel/model/form-panel/form-panel-item-config';
import {FormPanelItemComponent} from '@app/common/components/panel/model/form-panel/form-panel-item-component';
import {FormPanelSelectComponent} from '@app/common/components/panel/form-panel/form-panel-select/form-panel-select.component';


@Component({
    selector: 'wii-form-panel',
    templateUrl: 'form-panel.component.html',
    styleUrls: ['./form-panel.component.scss']
})
export class FormPanelComponent implements AfterViewInit {
    @Input()
    public header?: HeaderConfig;

    @Input()
    public body: Array<FormPanelItemConfig>;

    @ViewChildren('formElements')
    public formElements: QueryList<FormPanelItemComponent>;

    private afterViewInit: boolean;
    private fireZebraRequested: boolean;

    public get values(): {[name: string]: any} {
        return this.formElements
            ? this.formElements.reduce((acc, element: FormPanelItemComponent) => ({
                ...acc,
                [element.name]: element.value
            }), {})
            : {};
    }

    public get firstError(): string {
        return this.formElements
            ? this.formElements.reduce(
                (error: string, element: FormPanelItemComponent) => (error ? error : element.error),
                undefined
            )
            : undefined;
    }

    public ngAfterViewInit(): void {
        setTimeout(() => {
            this.afterViewInit = true;
            if (this.fireZebraRequested) {
                this.doFireZebraScan();
            }
        }, 600);
    }

    public fireZebraScan(): void {
        if (this.afterViewInit) {
            this.doFireZebraScan();
        }
        else {
            this.fireZebraRequested = true;
        }
    }

    private doFireZebraScan(): void {
        this.fireZebraRequested = false;
        this.getElementForZebraInit().forEach((element) => {
            element.fireZebraScan();
        });
    }

    public unsubscribeZebraScan() {
        this.fireZebraRequested = false;
        this.getElementForZebraInit().forEach((element) => {
            element.unsubscribeZebraScan();
        });
    }

    private getElementForZebraInit(): Array<FormPanelSelectComponent> {
        return (this.formElements
            ? this.formElements.filter((element) => (element instanceof FormPanelSelectComponent))
            : []) as unknown as Array<FormPanelSelectComponent>;
    }
}
