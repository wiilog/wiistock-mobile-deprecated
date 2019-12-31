import {Type} from "@angular/core";

export interface TitleConfig<T> {
    name: string;
    page: Type<T>;
    filter?: (instance: any) => boolean;
}
