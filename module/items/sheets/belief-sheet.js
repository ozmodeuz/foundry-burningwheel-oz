import { BWItemSheet } from "./bwItemSheet.js";
export class BeliefSheet extends BWItemSheet {
    getData() {
        const data = super.getData();
        return data;
    }
    get template() {
        return "systems/burningwheel/templates/items/belief.hbs";
    }
}
