export interface FormPanelInputConfig {
    type: 'number'|'text';
    min?: number;
    max?: number;
    required?: true;
    maxLength?: string;
    disabled?: boolean;
}
