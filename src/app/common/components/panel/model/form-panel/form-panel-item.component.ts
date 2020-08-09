import {FormPanelItemConfig} from '@app/common/components/panel/model/form-panel/configs/form-panel-item-config';

export interface FormPanelItemComponent<InputConfig> extends FormPanelItemConfig<InputConfig> {
    error: string;
}
