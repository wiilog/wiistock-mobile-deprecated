export interface ArticlePrepa {
    id?: number;
    label: string;
    reference: string;
    type_quantite?: string;
    quantite: number;
    is_ref: boolean;
    id_prepa: number;
    has_moved: number;
    emplacement: string;
    barcode?: string;

    // ArticlePrepaByRefArticle
    isSelectableByUser?: boolean;
    reference_article?: string;

}
