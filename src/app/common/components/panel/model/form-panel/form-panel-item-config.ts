import {FormPanelSigningConfig} from '@app/common/components/panel/model/form-panel/form-panel-signing-config';
import {FormPanelInputConfig} from '@app/common/components/panel/model/form-panel/form-panel-input-config';
import {FormPanelSelectConfig} from '@app/common/components/panel/model/form-panel/form-panel-select-config';

interface FormPanelItemConfigBase {
    label: string;
    name: string;
    value?: string|number;
    errors?: {[errorName: string]: string};
}

interface FormPanelItemConfigSigning extends FormPanelItemConfigBase {
    type: 'signing';
    inputConfig: FormPanelSigningConfig;
}

interface FormPanelItemConfigInput extends FormPanelItemConfigBase {
    type: 'input';
    inputConfig: FormPanelInputConfig;
}

interface FormPanelItemConfigSelect extends FormPanelItemConfigBase {
    type: 'select';
    inputConfig: FormPanelSelectConfig;
}

export type FormPanelItemConfig = FormPanelItemConfigSigning|FormPanelItemConfigInput|FormPanelItemConfigSelect;
