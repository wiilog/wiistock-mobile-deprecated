export interface TitleConfig {
    label?: string;
    pagePath: string;
    filter?: (data: Map<string, any>) => boolean;
    stackIndex?: number;
    paramsId?: number;
}
