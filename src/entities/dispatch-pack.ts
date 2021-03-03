export interface DispatchPack {
    id: number;
    code: string;
    natureId: number;
    quantity: number;
    dispatchId: number;
    lastLocation?: string;
    treated?: number;
    already_treated?: number;
    comment?: string;
}
