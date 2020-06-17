export interface TableDefinition {
    name: string;
    keepOnConnection?: boolean;
    /** attributeName => constraint */
    attributes: {
        [attributeName: string]: string
    }
}
