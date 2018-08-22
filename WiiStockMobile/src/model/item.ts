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