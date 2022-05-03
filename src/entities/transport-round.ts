import {TransportRoundLine} from '@entities/transport-round-line';

export interface TransportRound {
    id: number;
    number: string;
    status: string;
    date: string;
    estimated_distance: number;
    estimated_time: string;
    lines: Array<TransportRoundLine>
}
