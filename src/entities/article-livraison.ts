export interface ArticleLivraison {
    id: number;
    label: string;
    reference: string;
    quantite: number;
    is_ref: number;
    id_livraison: number;
    has_moved: number;
    emplacement: string;
    barcode?: string;
}
