export interface Translation {
    id: number,
    menu: string,
    label: string,
    translation: string
}

export type Translations = {[label: string]: string};
