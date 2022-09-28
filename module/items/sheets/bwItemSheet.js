import * as constants from "../../constants.js";
export class BWItemSheet extends ItemSheet {
    getData() {
        const data = {
            showImage: game.settings.get(constants.systemName, constants.settings.itemImages),
            data: this.item.data.data,
            item: this.item
        };
        return data;
    }
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["bw-app"]
        });
    }
}
