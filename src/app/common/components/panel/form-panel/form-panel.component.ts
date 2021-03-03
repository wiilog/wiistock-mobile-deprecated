import {AfterViewInit, Component, Input, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {FormPanelSelectComponent} from '@app/common/components/panel/form-panel/form-panel-select/form-panel-select.component';
import {FormPanelParam} from '@app/common/directives/form-panel/form-panel-param';
import {FormPanelDirective} from '@app/common/directives/form-panel/form-panel.directive';
import {FormViewerParam} from '@app/common/directives/form-viewer/form-viewer-param';
import {PanelHeaderComponent} from '@app/common/components/panel/panel-header/panel-header.component';


@Component({
    selector: 'wii-form-panel',
    templateUrl: 'form-panel.component.html',
    styleUrls: ['./form-panel.component.scss']
})
export class FormPanelComponent implements AfterViewInit {

    @Input()
    public detailPosition: 'top'|'bottom' = 'top'

    @Input()
    public header?: HeaderConfig;

    @Input()
    public body: Array<FormPanelParam>;

    @Input()
    public details?: Array<FormViewerParam>;

    @ViewChildren('formElements', {read: FormPanelDirective})
    public formElements: QueryList<FormPanelDirective>;

    @ViewChild('formHeaderComponent', {static: false})
    public formHeaderComponent: PanelHeaderComponent;

    private afterViewInit: boolean;
    private fireZebraRequested: boolean;

    public get values(): {[name: string]: any} {
        return this.formElements
            ? this.formElements.reduce((acc, {instance: {group, name, value}, param: {config}}: FormPanelDirective) => ({
                ...acc,
                ...((!config.ignoreEmpty
                    || typeof value === 'boolean'
                    || (Array.isArray(value) && value.length > 0)
                    || (!Array.isArray(value) && value)) ?
                    {
                        [group || name]: group
                            ? { ...(acc[group] || {}), [name]: value}
                            : value
                    }
                    : {})
            }), {})
            : {};
    }

    public get firstError(): string {
        return this.formElements
            ? this.formElements.reduce(function (error: string, {instance: {error: itemError}}: FormPanelDirective) {
                    return error || itemError
                },
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
        this.getInstanceForZebraInit().forEach((element) => {
            element.fireZebraScan();
        });
    }

    public unsubscribeZebraScan() {
        this.fireZebraRequested = false;
        this.getInstanceForZebraInit().forEach((element) => {
            element.unsubscribeZebraScan();
        });
    }

    private getInstanceForZebraInit(): Array<FormPanelSelectComponent> {
        if(this.formElements) {
            return this.formElements
                .filter(({instance}) => instance instanceof FormPanelSelectComponent)
                .map(({instance}) => instance) as unknown as Array<FormPanelSelectComponent>;
        } else {
            return [];
        }
    }
}
