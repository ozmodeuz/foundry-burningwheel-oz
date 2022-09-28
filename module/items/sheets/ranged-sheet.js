import { gearQualitySelect } from "../../constants.js";
import { BWItemSheet } from "./bwItemSheet.js";
export class RangedWeaponSheet extends BWItemSheet {
    get template() {
        return "systems/burningwheel/templates/items/rangedWeapon.hbs";
    }
    getData() {
        const data = super.getData();
        data.weaponQualities = gearQualitySelect;
        return data;
    }
}
