export class BWSetting extends Actor {
    async createEmbeddedDocuments(type, data, options) {
        data = data.filter(i => i.type === "lifepath");
        return super.createEmbeddedDocuments(type, data, options);
    }
}
