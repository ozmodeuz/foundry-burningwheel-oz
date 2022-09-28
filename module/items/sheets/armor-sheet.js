import { armorLocationSelect, gearQualitySelect } from "../../constants.js";
import { BWItemSheet } from "./bwItemSheet.js";
export class ArmorSheet extends BWItemSheet {
    get template() {
        return "systems/burningwheel/templates/items/armor.hbs";
    }
    getData() {
        const data = super.getData();
        data.armorLocations = armorLocationSelect;
        data.armorQuality = gearQualitySelect;
        return data;
    }
}
