export class ApiServices {
    public static readonly GET_NOMADE_VERSIONS: string = '/nomade-versions';
    public static readonly GET_PING: string = '/ping';

    public static readonly BEGIN_PREPA: string = '/beginPrepa';
    public static readonly FINISH_PREPA: string = '/finishPrepa';
    public static readonly BEGIN_LIVRAISON: string = '/beginLivraison';
    public static readonly FINISH_LIVRAISON: string = '/finishLivraison';
    public static readonly BEGIN_COLLECTE: string = '/beginCollecte';
    public static readonly FINISH_COLLECTE: string = '/finishCollecte';
    public static readonly TREAT_ANOMALIES: string = '/treatAnomalies';
    public static readonly CONNECT: string = '/connect';
    public static readonly ADD_INVENTORY_ENTRIES: string = '/addInventoryEntries';
    public static readonly ADD_MOUVEMENT_TRACA: string = '/addMouvementTraca';
    public static readonly VALIDATE_MANUT: string = '/validateManut';
    public static readonly GET_DATA: string = '/getData';
}
