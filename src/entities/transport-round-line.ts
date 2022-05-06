export interface TransportRoundLine {
    id: number;
    number: string;
    type: string;
    type_icon: string;
    collect: {
        type: string;
        type_icon: string;
        time_slot: string;
        success: boolean;
        failure: boolean;
    };
    status: string;
    kind: `delivery` | `collect`;
    packs: Array<{
        code: string;
        nature: string;
        temperature_range: string;
        color: string;
    }>;
    expected_at: string;
    expected_time: string;
    estimated_time: string;
    time_slot: string;
    contact: {
        file_number: string;
        address: string;
        contact: string;
        person_to_contact: string;
        observation: string;
        latitude: string;
        longitude: string;
    };
    comment: string|null;
    photos: Array<string>|null; // urls des photos
    signature: string|null; // url de la signature
    requester: string;
    free_fields: Array<{
        id: number,
        label: string,
        value: string
    }>;
    priority: number;
    cancelled: boolean;
    success: boolean;
    failure: boolean;
}