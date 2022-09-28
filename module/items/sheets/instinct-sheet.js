import { BWItemSheet } from "./bwItemSheet.js";
export class InstinctSheet extends BWItemSheet {
    getData() {
        const data = super.getData();
        return data;
    }
    get template() {
        return "systems/burningwheel/templates/items/instinct.hbs";
    }
}
