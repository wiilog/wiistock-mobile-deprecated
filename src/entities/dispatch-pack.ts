export interface DispatchPack {
    id: number;
    code: string;
    natureId: number;
    quantity: number;
    dispatchId: number;
    lastLocation?: string;
    treated?: number;
}
