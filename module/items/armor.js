import { BWItem } from "./item.js";
import { rollDice } from "../rolls/rolls.js";
export class Armor extends BWItem {
    prepareData() {
        super.prepareData();
        this.data.data.cssClass = "equipment-armor";
        const dice = this.data.data.dice;
        this.data.data.helmDisplayClass = this.calculateDisplayClass(dice, this.data.data.damageHelm);
        this.data.data.torsoDisplayClass = this.calculateDisplayClass(dice + 1, this.data.data.damageTorso);
        this.data.data.leftArmDisplayClass = this.calculateDisplayClass(dice, this.data.data.damageLeftArm);
        this.data.data.rightArmDisplayClass = this.calculateDisplayClass(dice, this.data.data.damageRightArm);
        this.data.data.leftLegDisplayClass = this.calculateDisplayClass(dice, this.data.data.damageLeftLeg);
        this.data.data.rightLegDisplayClass = this.calculateDisplayClass(dice, this.data.data.damageRightLeg);
        this.data.data.shieldDisplayClass = this.calculateDisplayClass(dice, this.data.data.damageShield);
    }
    calculateDisplayClass(dice, locationDice) {
        if (parseInt(locationDice) >= dice) {
            return "armor-broken";
        }
        return "";
    }
    async assignDamage(roll, location) {
        const num1s = roll.dice[0].results.filter(r => r.result === 1).length;
        if (num1s === 0) {
            return new Promise(r => r(0));
        }
        const locationAccessor = `data.damage${location}`;
        const damage = parseInt(getProperty(this, `data.${locationAccessor}`)) || 0;
        const updateData = {};
        let newDamage = 0;
        switch (this.data.data.quality) {
            case "run of the mill":
                newDamage = Math.min(this.data.data.dice, damage + 1);
                updateData[locationAccessor] = newDamage;
                await this.update(updateData);
                return new Promise(r => r(1));
            case "superior":
                const reroll = await rollDice(num1s, false, "B");
                if (reroll && reroll.dice[0].results.filter(r => r.result === 1).length) {
                    newDamage = Math.min(this.data.data.dice, damage + 1);
                    updateData[locationAccessor] = newDamage;
                    await this.update(updateData);
                    return new Promise(r => r(1));
                }
                return new Promise(r => r(0));
            default:
                newDamage = Math.min(this.data.data.dice, damage + num1s);
                updateData[locationAccessor] = newDamage;
                await this.update(updateData);
                return new Promise(r => r(num1s));
        }
    }
}
