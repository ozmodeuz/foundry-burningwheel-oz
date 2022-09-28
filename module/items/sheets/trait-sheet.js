import { traitTypeSelect } from "../../constants.js";
import { BWItemSheet } from "./bwItemSheet.js";
export class TraitSheet extends BWItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {});
    }
    get template() {
        return "systems/burningwheel/templates/items/trait.hbs";
    }
    getData() {
        const data = super.getData();
        data.traitTypes = traitTypeSelect;
        return data;
    }
}
