export interface MouvementTraca {
    ref_article: string;
    type: string;
    operateur: string;
    ref_emplacement: string;
    date: string;
    id?: number;
    nature_id?: number;

    //transfer
    fromStock?: number;
    quantity?: number;

    // prise
    finished?: number;

    // depose
    comment?: string;
    signature?: string;
}
