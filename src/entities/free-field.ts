export interface FreeField {
    id: number;
    label: string;
    type: string;
    typing: string;
    required: number;
    elements: string;
    defaultValue: string;
}

export enum FreeFieldType {
    TRACKING = 'mouvement traca'
}

export enum FreeFieldTyping {
    BOOL = 'booleen',
    DATE = 'date',
    DATETIME = 'datetime',
    TEXT = 'text',
    NUMBER = 'number',
    LIST = 'list',
    MULTI_LIST = 'list multiple'
}
