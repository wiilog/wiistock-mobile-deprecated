export interface Anomalie {
    id: number;
    reference: string;
    is_ref: number;
    quantity: number;
    countedQuantity: number;
    location: string;
    comment: string;
    treated: string;
    barcode?: string;
    is_treatable?: number;
}
