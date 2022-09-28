import { BWItemSheet } from "./bwItemSheet.js";
export class RelationshipSheet extends BWItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {});
    }
    get template() {
        return "systems/burningwheel/templates/items/relationship.hbs";
    }
}
