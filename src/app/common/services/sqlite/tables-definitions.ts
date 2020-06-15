import {TableDefinition} from '@app/common/services/sqlite/table-definition';

export const TablesDefinitions: Array<TableDefinition> = [
    {
        name: 'emplacement',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            label: 'VARCHAR(255)'
        }
    },
    {
        name: 'mouvement',
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            reference: 'INTEGER',
            quantity: 'INTEGER',
            date_pickup: 'VARCHAR(255)',
            location_from: 'TEXT',
            date_drop: 'VARCHAR(255)',
            location: 'TEXT',
            type: 'VARCHAR(255)',
            is_ref: 'INTEGER',
            id_article_prepa: 'INTEGER',
            id_prepa: 'INTEGER',
            id_article_livraison: 'INTEGER',
            id_livraison: 'INTEGER',
            id_article_collecte: 'INTEGER',
            id_collecte: 'INTEGER',
            selected_by_article: 'INTEGER'
        }
    },
    {
        name: 'mouvement_traca',
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            ref_article: 'VARCHAR(255)',
            date: 'VARCHAR(255)',
            ref_emplacement: 'VARCHAR(255)',
            type: 'VARCHAR(255)',
            operateur: 'VARCHAR(255)',
            comment: 'VARCHAR(255)',
            signature: 'TEXT',
            finished: 'INTEGER',
            fromStock: 'INTEGER',
            quantity: 'INTEGER'
        }
    },
    {
        name: 'preparation',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            numero: 'TEXT',
            emplacement: 'TEXT',
            date_end: 'TEXT',
            destination: 'TEXT',
            started: 'INTEGER',
            requester: 'VARCHAR(255)',
            type: 'VARCHAR(255)'
        }
    },
    {
        name: 'article_prepa',
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            label: 'TEXT',
            reference: 'TEXT',
            emplacement: 'TEXT',
            type_quantite: 'TEXT',
            barcode: 'TEXT',
            reference_article_reference: 'TEXT',
            quantite: 'INTEGER',
            is_ref: 'INTEGER',
            id_prepa: 'INTEGER',
            has_moved: 'INTEGER',
            isSelectableByUser: 'INTEGER',
            original_quantity: 'INTEGER',
            deleted: 'INTEGER DEFAULT 0'
        }
    },
    {
        name: 'article_prepa_by_ref_article',
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            reference: 'TEXT',
            label: 'TEXT',
            location: 'TEXT',
            reference_article: 'TEXT',
            barcode: 'TEXT',
            quantity: 'INTEGER',
            isSelectableByUser: 'INTEGER'
        }
    },
    {
        name: 'livraison',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            numero: 'TEXT',
            emplacement: 'TEXT',
            date_end: 'TEXT',
            requester: 'VARCHAR(255)',
            type: 'VARCHAR(255)'
        }
    },
    {
        name: 'collecte',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            number: 'TEXT',
            date_end: 'TEXT',
            location_from: 'VARCHAR(255)',
            location_to: 'VARCHAR(255)',
            requester: 'VARCHAR(255)',
            type: 'VARCHAR(255)',
            forStock: 'INTEGER'
        }
    },
    {
        name: 'article_livraison',
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            label: 'TEXT',
            reference: 'TEXT',
            emplacement: 'TEXT',
            barcode: 'TEXT',
            quantite: 'INTEGER',
            is_ref: 'INTEGER',
            id_livraison: 'INTEGER',
            has_moved: 'INTEGER'
        }
    },
    {
        name: 'article_inventaire',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            reference: 'TEXT',
            location: 'TEXT',
            barcode: 'TEXT',
            id_mission: 'INTEGER',
            is_ref: 'INTEGER'
        }
    },
    {
        name: 'article_collecte',
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            label: 'TEXT',
            reference: 'TEXT',
            emplacement: 'TEXT',
            barcode: 'TEXT',
            quantite: 'INTEGER',
            is_ref: 'INTEGER',
            id_collecte: 'INTEGER',
            has_moved: 'INTEGER'
        }
    },
    {
        name: 'saisie_inventaire',
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            reference: 'TEXT',
            date: 'TEXT',
            location: 'TEXT',
            id_mission: 'INTEGER',
            is_ref: 'INTEGER',
            quantity: 'INTEGER'
        }
    },
    {
        name: 'anomalie_inventaire',
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            reference: 'TEXT',
            location: 'TEXT',
            comment: 'TEXT',
            barcode: 'TEXT',
            treated: 'TEXT',
            is_ref: 'INTEGER',
            quantity: 'INTEGER'
        }
    },
    {
        name: 'manutention',
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            demandeur: 'TEXT',
            date_attendue: 'TEXT',
            commentaire: 'TEXT',
            destination: 'TEXT',
            source: 'TEXT',
            objet: 'TEXT',
        }
    },
    {
        name: 'demande_livraison',
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            location_id: 'integer',
            comment: 'VARCHAR(255)',
            type_id: 'integer'
        }
    },
    {
        name: 'article_in_demande_livraison',
        attributes: {
            demande_id: 'INTEGER',
            article_id: 'INTEGER',
            quantity_to_pick: 'INTEGER'
        }
    },
    {
        name: 'demande_livraison_type',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            label: 'VARCHAR(255)'
        }
    },
    {
        name: 'demande_livraison_article',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            label: 'VARCHAR(255)',
            reference: 'VARCHAR(255)',
            bar_code: 'VARCHAR(255)',
            type_quantity: 'VARCHAR(255)',
            location_label: 'VARCHAR(255)',
            available_quantity: 'INTEGER'
        }
    }
];
