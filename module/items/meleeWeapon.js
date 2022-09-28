import { BWItem } from "./item.js";
import * as helpers from "../helpers.js";
import { translateWoundValue } from "../helpers.js";
export class MeleeWeapon extends BWItem {
    prepareData() {
        super.prepareData();
        const actorData = this.actor && this.actor.data;
        if (actorData) {
            let power = actorData.data.power.exp;
            if (actorData.data.power.shade === "G") {
                power += 2;
            }
            if (actorData.data.power.shade === "W") {
                power += 3;
            }
            Object.values(this.data.data.attacks || []).forEach(ad => {
                const baseDmg = power + ad.power;
                ad.incidental = Math.ceil(baseDmg / 2);
                ad.mark = baseDmg;
                ad.superb = Math.floor(baseDmg * 1.5);
            });
        }
        this.data.data.cssClass = "equipment-weapon";
    }
    async getWeaponMessageData(attackIndex) {
        const element = document.createElement("div");
        element.className = "weapon-extra-info";
        element.appendChild(helpers.DivOfText(`${this.name} ${this.data.data.attacks[attackIndex].attackName}`, "ims-title shade-black"));
        element.appendChild(helpers.DivOfText("I", "ims-header"));
        element.appendChild(helpers.DivOfText("M", "ims-header"));
        element.appendChild(helpers.DivOfText("S", "ims-header"));
        element.appendChild(helpers.DivOfText("Add", "ims-header"));
        element.appendChild(helpers.DivOfText("Va", "ims-header"));
        element.appendChild(helpers.DivOfText("Length", "ims-header"));
        element.appendChild(helpers.DivOfText(translateWoundValue(this.data.data.shade, this.data.data.attacks[attackIndex].incidental || 1)));
        element.appendChild(helpers.DivOfText(translateWoundValue(this.data.data.shade, this.data.data.attacks[attackIndex].mark || 1)));
        element.appendChild(helpers.DivOfText(translateWoundValue(this.data.data.shade, this.data.data.attacks[attackIndex].superb || 1)));
        element.appendChild(helpers.DivOfText(this.data.data.attacks[attackIndex].add));
        element.appendChild(helpers.DivOfText(this.data.data.attacks[attackIndex].vsArmor));
        element.appendChild(helpers.DivOfText(this.data.data.attacks[attackIndex].weaponLength.titleCase()));
        return element.outerHTML;
    }
}
