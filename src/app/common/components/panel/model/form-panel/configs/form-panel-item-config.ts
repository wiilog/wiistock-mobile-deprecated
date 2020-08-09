export interface FormPanelItemConfig<InputConfig> {
    label: string;
    name: string|number;
    group?: string;
    value?: string|number|boolean;
    errors?: {[errorName: string]: string};
    inputConfig: InputConfig;
}
