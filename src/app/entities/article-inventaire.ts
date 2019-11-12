export interface ArticleInventaire {
    id: number;
    id_mission: number;
    reference: string;
    is_ref: boolean;
    location: string;
    barcode?: string;
}
