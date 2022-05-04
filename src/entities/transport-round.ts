import {TransportRoundLine} from '@entities/transport-round-line';

export interface TransportRound {
    id: number;
    number: string;
    status: string;
    date: string;
    estimated_distance: number;
    estimated_time: string;
    total_deliveries: number;
    remaining_deliveries: number;
    total_transports: number;
    remaining_transports: number;
    remaining_loaded: number;
    total_loaded: number;
    lines: Array<TransportRoundLine>
}
