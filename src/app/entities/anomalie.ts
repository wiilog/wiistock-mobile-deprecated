export interface Anomalie {
    id: number;
    reference: string;
    is_ref: boolean;
    quantity: number;
    location: string;
    comment: string;
    treated: string;
    barcode?: string;
}
