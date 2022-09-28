import { gearQualitySelect, weaponLengthSelect } from "../../constants.js";
import { BWItemSheet } from "./bwItemSheet.js";
export class MeleeWeaponSheet extends BWItemSheet {
    get item() {
        return super.item;
    }
    get template() {
        return "systems/burningwheel/templates/items/meleeWeapon.hbs";
    }
    getData() {
        const data = super.getData();
        data.weaponLengths = weaponLengthSelect;
        data.weaponQualities = gearQualitySelect;
        return data;
    }
    activateListeners(html) {
        super.activateListeners(html);
        html.find(".fa-plus").on('click', () => {
            const attacks = Object.values(this.item.data.data.attacks || []);
            attacks.push({
                attackName: "Alternate",
                power: 1,
                add: 2,
                vsArmor: 0,
                weaponLength: "Shortest",
                weaponSpeed: "2"
            });
            this.item.update({ "data.attacks": attacks }, {});
        });
        html.find(".fa-minus").on('click', (e) => {
            const target = e.target;
            const index = parseInt(target.dataset.index);
            const attacks = Object.values(this.item.data.data.attacks || []);
            attacks.splice(index, 1);
            this.item.update({ "data.attacks": attacks }, {});
        });
    }
}
