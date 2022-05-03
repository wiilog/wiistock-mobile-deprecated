import {TransportRoundLine} from "@entities/transport-round-line";

export interface TransportRound {
    id: number;
    number: string;
    status: string;
    lines: Array<TransportRoundLine>
}
