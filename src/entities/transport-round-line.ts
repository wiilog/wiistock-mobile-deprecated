export interface TransportRoundLine {
    id: number;
    number: string;
    type: string;
    type_icon: string;
    collect: {
        type: string;
        type_icon: string;
        time_slot: string;
    };
    status: string;
    kind: `delivery` | `collect`;
    packs: Array<{
        code: string,
        nature: string,
        nature_id: number,
        temperature_range: string,
        color: string;
        loaded?: boolean;
    }>;
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
    free_fields: Array<{
        id: number,
        label: string,
        value: string
    }>;
    priority: number;
}