export interface MouvementTraca<FileType = string> {
    ref_article: string;
    type: string;
    operateur: string;
    ref_emplacement: string;
    date: string;
    id?: number;
    nature_id?: number;
    quantity: number;

    //transfer
    fromStock?: number;

    // prise
    finished?: number;

    // depose
    comment?: string;
    signature?: FileType;
    photo?: FileType;
    freeFields?: string;

    // grouping
    subPacks?: string;
    packParent?: string;
    isGroup?: number;
}
