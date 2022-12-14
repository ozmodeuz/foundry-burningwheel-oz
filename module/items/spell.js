import { weaponLengthSelect } from "../constants.js";
import { DivOfText } from "../helpers.js";
import { BWItem } from "./item.js";
export class Spell extends BWItem {
    prepareData() {
        super.prepareData();
        const actor = this.actor;
        this.data.obstacleLabel =
            `${this.data.data.variableObstacle ?
                this.data.data.variableObstacleDescription :
                this.data.data.obstacle}${this.data.data.upSpell ?
                '^' : ''}`;
        if (this.data.data.isWeapon && this.data.hasOwner && actor) {
            const willScore = actor.data.data.will.exp;
            if (this.data.data.halfWill) {
                this.data.data.mark = Math.floor(willScore / 2.0) + this.data.data.willDamageBonus;
            }
            else {
                this.data.data.mark = willScore + this.data.data.willDamageBonus;
            }
            this.data.data.incidental = Math.ceil(this.data.data.mark / 2.0);
            this.data.data.superb = Math.floor(this.data.data.mark * 1.5);
        }
        this.data.spellLengths = weaponLengthSelect;
        if (this.data.hasOwner && actor) {
            this.data.data.aptitude = 10 - actor.data.data.perception.exp || 1
                + actor.getAptitudeModifiers("perception")
                + actor.getAptitudeModifiers("spells");
        }
    }
    async getSpellMessageData() {
        const element = document.createElement("div");
        element.className = "spell-extra-info";
        element.appendChild(DivOfText(this.name, "spell-title"));
        if (this.data.data.isWeapon) {
            const roll = (await new Roll("1d6").roll({ async: true })).dice[0].results[0].result;
            element.appendChild(DivOfText("I", "ims-header"));
            element.appendChild(DivOfText("M", "ims-header"));
            element.appendChild(DivOfText("S", "ims-header"));
            element.appendChild(DivOfText("Va", "ims-header"));
            element.appendChild(DivOfText("Act.", "ims-header"));
            element.appendChild(DivOfText("DoF", "ims-header"));
            element.appendChild(DivOfText("Length", "ims-header"));
            element.appendChild(DivOfText("B " + this.data.data.incidental, roll < 3 ? "highlight" : undefined));
            element.appendChild(DivOfText("B " + this.data.data.mark, [3, 4].includes(roll) ? "highlight" : undefined));
            element.appendChild(DivOfText("B " + this.data.data.superb, roll > 4 ? "highlight" : undefined));
            element.appendChild(DivOfText("" + this.data.data.va));
            element.appendChild(DivOfText("" + this.data.data.actions));
            element.appendChild(DivOfText(`${roll}`, "roll-die"));
            element.appendChild(DivOfText(this.data.data.weaponLength));
        }
        return element.outerHTML;
    }
}
