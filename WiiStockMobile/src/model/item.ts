export class ItemModel {
	private type: string;
	private auteur: string;
	private date: string;

	constructor(type: string, auteur: string, date: string) {
		this.type = type;
		this.auteur = auteur;
		this.date = date;
	}
}

export class ArticleModel {
	private nom : string;
	private localisation : string;
	private quantite : number;

	constructor(nom: string, localisation: string, quantite: number) {
		this.nom  = nom;
		this.localisation = localisation;
		this.quantite = quantite;		
	}
}