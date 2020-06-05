export interface FormPanelItemConfig<T> {
    label: string;
    name: string;
    value?: string|number;
    errors?: {[erroName: string]: string};
    type?: 'input'|'signing';
    inputConfig: T;
}
