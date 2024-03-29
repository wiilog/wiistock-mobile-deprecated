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
    mission_id: number;
    mission_start: string;
    mission_end: string;
    mission_name: string;
}
