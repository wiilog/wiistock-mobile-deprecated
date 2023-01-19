import {Reference} from "@entities/reference";

export interface DispatchPack {
    id?: number;
    code: string;
    natureId?: number;
    quantity: number;
    dispatchId: number;
    lastLocation?: string;
    treated?: number;
    already_treated?: number;
    comment?: string;
    photo1?: string;
    photo2?: string;
    reference?: string;
}
