export interface Dispatch {
    id: number;
    requester: string;
    number: string;
    carrierTrackingNumber: string;
    startDate: string;
    endDate: string;
    emergency: string;
    locationFromLabel: string;
    locationFromId: number;
    locationToLabel: string;
    locationToId: number;
    typeLabel: string;
    typeId: number;
    typeColor: string;
    treatedStatusId: number;
    partial: number;
    statusLabel: string;
    statusId: number;
    color: string;
    destination: string;
    comment: string;
    packReferences: string;
    quantities: string;
    packs: string;
    draft?: boolean;
    groupedSignatureStatusColor?: string;
}
