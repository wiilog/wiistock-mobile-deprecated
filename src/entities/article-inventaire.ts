export interface ArticleInventaire {
    id: number;
    mission_id: number;
    mission_start: string;
    mission_end: string;
    mission_name: string;
    reference: string;
    is_ref: number;
    location: string;
    barcode?: string;
}
