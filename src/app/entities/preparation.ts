export interface Preparation {
    id: number;
    numero: string;

    destination: string; // emplacement de livraison
    requester: string; // demandeur dans la demande de livraison

    emplacement: string;
    date_end: string;
    started: number;
    type: string;
}
