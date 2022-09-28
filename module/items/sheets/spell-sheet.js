import { weaponLengthSelect } from "../../constants.js";
import { BWItemSheet } from "./bwItemSheet.js";
export class SpellSheet extends BWItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {});
    }
    get template() {
        return "systems/burningwheel/templates/items/spell.hbs";
    }
    getData() {
        const data = super.getData();
        data.spellLengths = weaponLengthSelect;
        return data;
    }
}
