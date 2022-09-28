import { BWItemSheet } from "./bwItemSheet.js";
export class ReputationSheet extends BWItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {});
    }
    get template() {
        return "systems/burningwheel/templates/items/reputation.hbs";
    }
}
