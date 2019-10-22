export interface Mouvement {
    id: number;
    reference: string;
    quantity: number;
    date_pickup: string;
    location_from: string;
    date_drop: string;
    location: string;
    type: string;
    is_ref: string;
    id_article_prepa: number;
    id_prepa: number;
    id_article_livraison: number;
    id_livraison: number;
    selected_by_article?: boolean;
}
