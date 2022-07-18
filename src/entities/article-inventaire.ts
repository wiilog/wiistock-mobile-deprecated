export interface ArticleInventaire {
    id: number;
    id_mission: number;
    start_mission: string;
    end_mission: string;
    name_mission: string;
    reference: string;
    is_ref: number;
    location: string;
    barcode?: string;
}
