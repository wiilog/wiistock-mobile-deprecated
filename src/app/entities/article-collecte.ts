export interface ArticleCollecte {
    id: number;
    label: string;
    reference: string;
    quantite: number;
    is_ref: boolean;
    id_collecte: number;
    has_moved: number;
    emplacement: string;
    barcode?: string;
}
