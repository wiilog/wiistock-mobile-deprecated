import {Injectable} from '@angular/core';
import {FreeField, FreeFieldTyping} from '@entities/free-field';
import {FormPanelToggleComponent} from '@app/common/components/panel/form-panel/form-panel-toggle/form-panel-toggle.component';
import {FormPanelParam} from '@app/common/directives/form-panel/form-panel-param';
import {FormPanelCalendarMode} from '@app/common/components/panel/form-panel/form-panel-calendar/form-panel-calendar-mode';
import {FormPanelCalendarComponent} from '@app/common/components/panel/form-panel/form-panel-calendar/form-panel-calendar.component';
import {FormPanelInputComponent} from '@app/common/components/panel/form-panel/form-panel-input/form-panel-input.component';
import * as moment from 'moment';
import {FormPanelSelectComponent} from '@app/common/components/panel/form-panel/form-panel-select/form-panel-select.component';

@Injectable({
    providedIn: 'root'
})
export class FormPanelService {
    public createFromFreeField(freeField: FreeField, value: any, formPanelItemGroup: string): FormPanelParam|undefined {
        const common = {
            label: freeField.label,
            name: freeField.id,
            group: formPanelItemGroup,
            errors: {
                required: `Le champ ${freeField.label} est requis`
            }
        };
        console.log(freeField.label, value);
        return (
            freeField.typing === FreeFieldTyping.BOOL ? {
                item: FormPanelToggleComponent,
                config: {
                    ...common,
                    value: value !== undefined ? Boolean(Number(value)) : Boolean(Number(freeField.defaultValue)),
                    inputConfig: {}
                }
            } :
            ((freeField.typing === FreeFieldTyping.DATE) || (freeField.typing === FreeFieldTyping.DATETIME)) ? {
                item: FormPanelCalendarComponent,
                config: {
                    ...common,
                    value: value === null || value === undefined
                        ? (freeField.defaultValue
                            ? moment(freeField.defaultValue, 'DD/MM/YYYY').format('YYYY-MM-DD')
                            : undefined)
                        : value,
                    inputConfig: {
                        required: Boolean(freeField.required),
                        mode: (freeField.typing === FreeFieldTyping.DATE ? FormPanelCalendarMode.DATE : FormPanelCalendarMode.DATETIME)
                    } as any
                }
            } :
            ((freeField.typing === FreeFieldTyping.TEXT) || (freeField.typing === FreeFieldTyping.NUMBER)) ? {
                item: FormPanelInputComponent,
                config: {
                    ...common,
                    value: value || freeField.defaultValue,
                    inputConfig: {
                        required: Boolean(freeField.required),
                        type: freeField.typing
                    } as any
                }
            } :
            ((freeField.typing === FreeFieldTyping.LIST) || (freeField.typing === FreeFieldTyping.MULTI_LIST)) ? {
                item: FormPanelSelectComponent,
                config: {
                    ...common,
                    value: (freeField.typing === FreeFieldTyping.LIST)

                        ? (value || freeField.defaultValue)
                        : (value || freeField.defaultValue || '').split(',').map((id) => ({id, label: id})),
                    inputConfig: {
                        required: Boolean(freeField.required),
                        barcodeScanner: false,
                        isMultiple: freeField.typing === FreeFieldTyping.MULTI_LIST,
                        elements: freeField.elements
                            ? JSON.parse(freeField.elements).map((label) => ({id: label, label}))
                            : []
                    } as any
                }
            } :
            undefined
        )
    }
}
