export interface Anomalie {
    id: number;
    reference: string;
    is_ref: string;
    quantity: number;
    location: string;
    comment: string;
    treated: string;
    code_barre? : string;
}
