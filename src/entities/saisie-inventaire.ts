export interface SaisieInventaire {
    id: number;
    mission_id: number;
    date: string;
    bar_code: string;
    is_ref: number;
    quantity: number;
    location: string;
}
