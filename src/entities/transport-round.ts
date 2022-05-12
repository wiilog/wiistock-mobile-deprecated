import {TransportRoundLine} from '@entities/transport-round-line';

export interface TransportRound {
    id: number;
    number: string;
    status: string;
    date: string;
    estimated_distance: number;
    estimated_time: string;
    ready_deliveries: number;
    total_ready_deliveries: number;
    total_transports: number;
    done_transports: number;
    loaded_packs: number;
    total_loaded: number;
    lines: Array<TransportRoundLine>
}
