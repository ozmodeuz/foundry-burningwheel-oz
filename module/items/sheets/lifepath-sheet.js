import { BWItemSheet } from "./bwItemSheet.js";
export class LifepathSheet extends BWItemSheet {
    getData() {
        const data = super.getData();
        return data;
    }
    get template() {
        return "systems/burningwheel/templates/items/lifepath.hbs";
    }
    activateListeners(html) {
        super.activateListeners(html);
        html.on('drop', (e) => this._onDrop(e.originalEvent));
    }
    async _onDrop(event) {
        let data;
        try {
            data = JSON.parse(event.dataTransfer?.getData('text/plain') || "");
        }
        catch (err) {
            console.error(err);
            return;
        }
        if (data.type === "Item" && data.id) {
            let item;
            if (data.pack) {
                item = await game.packs?.find(p => p.collection === data.pack).getDocument(data.id);
            }
            else if (data.actorId) {
                item = game.actors?.find((a) => a.id === data.actorId).items.get(data.id);
            }
            else {
                item = game.items?.find((i) => i.id === data.id);
            }
            if (item) {
                if (item.type === "skill") {
                    const skillList = `${this.item.data.data.skillList}${this.item.data.data.skillList ? ', ' : ''}${item.name}`;
                    this.item.update({ "data.skillList": skillList }, {});
                }
                else if (item.type === "trait") {
                    const traitList = `${this.item.data.data.traitList}${this.item.data.data.traitList ? ', ' : ''}${item.name}`;
                    this.item.update({ "data.traitList": traitList }, {});
                }
            }
        }
    }
}
