export interface TableDefinition {
    name: string;
    /** attributeName => constraint */
    attributes: {
        [attributeName: string]: string
    }
}
