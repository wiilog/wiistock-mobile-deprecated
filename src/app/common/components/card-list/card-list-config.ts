export interface CardListConfig {
    title: {
        label: string;
        value: string;
    };
    content: Array<{
        label: string;
        value: string;
    }>;
    action?: () => void;
    info?: string;
    error?: string;
}
