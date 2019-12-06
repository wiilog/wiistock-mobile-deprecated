import {FormPanelItemConfig} from "@helpers/components/panel/model/form-panel/form-panel-item-config";


export interface FormPanelItemComponent<T> extends FormPanelItemConfig<T> {
    error: string;
}
