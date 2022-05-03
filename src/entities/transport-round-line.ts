export interface TransportRoundLine {
    id: number;
    number: string;
    type: number;
    status: string;
    kind: `delivery` | `collect`;
    packs: Array<{number: string, nature: string, temperature_range: string}>;
    expected_at: string;
    estimated_time: string;
    time_slot: string;
    contact: {
        file_number: string;
        address: string;
        contact: string;
        person_to_contact: string;
        observation: string;
    };
    comment: string;
    photos: Array<string>; // urls des photos
    signature: string; // url de la signature
    requester: string;
    free_fields: Array<{id: number, label: string, value: string}>;
    priority: number;
}