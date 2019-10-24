export interface ArticlePrepa {
    id: number;
    label: string;
    reference: string;
    type_quantite?: string;
    quantite: number;
    is_ref: string;
    id_prepa: number;
    has_moved: number;
    emplacement: string;

    // ArticlePrepaByRefArticle
    isSelectableByUser?: boolean;
    reference_article?: string;

}
