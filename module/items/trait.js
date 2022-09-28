import { simpleBroadcast } from "../chat.js";
import { BWItem } from "./item.js";
export class Trait extends BWItem {
    prepareData() {
        super.prepareData();
        this.data.isCallonTrait = this.data.data.traittype === "call-on";
        this.data.isDieTrait = this.data.data.traittype === "die";
    }
    static asRollDieModifier(trait) {
        return {
            label: trait.name,
            optional: true,
            dice: trait.data.dieModifier || 0
        };
    }
    static asRollObModifier(trait) {
        return {
            label: trait.name,
            optional: true,
            obstacle: trait.data.obModifier || 0
        };
    }
    async generateChatMessage(actor) {
        const extraData = [];
        if (this.data.data.traittype === "call-on") {
            extraData.push({
                title: "Call-on For",
                text: this.data.data.callonTarget
            });
        }
        else if (this.data.data.traittype === "die") {
            if (this.data.data.hasAptitudeModifier) {
                extraData.push({
                    title: "Affects Aptitude",
                    text: `${this.data.data.aptitudeTarget.trim()} : ${this.data.data.aptitudeModifier}`
                });
            }
            if (this.data.data.hasDieModifier) {
                extraData.push({
                    title: "Adds Dice",
                    text: `${this.data.data.dieModifierTarget} : ${this.data.data.dieModifier >= 0 ? '+' + this.data.data.dieModifier : this.data.data.dieModifier}D`
                });
            }
            if (this.data.data.hasObModifier) {
                extraData.push({
                    title: "Changed Obstacle",
                    text: `${this.data.data.obModifierTarget} : ${this.data.data.obModifier >= 0 ? '+' + this.data.data.obModifier : this.data.data.obModifier} Ob`
                });
            }
            if (this.data.data.addsAffiliation) {
                extraData.push({
                    title: "Adds an Affiliation",
                    text: `${this.data.data.affiliationDice}D with ${this.data.data.affiliationName}`
                });
            }
            if (this.data.data.addsReputation) {
                extraData.push({
                    title: "Adds a Reputation",
                    text: `${this.data.data.reputationDice}D ${this.data.data.reputationInfamous ? "infamous " : ""}reputation as ${this.data.data.reputationName}`
                });
            }
        }
        extraData.push({
            title: `${this.data.data.traittype.titleCase()} Trait`
        });
        const data = {
            title: this.name,
            mainText: this.data.data.text || "No Description Given",
            extraData
        };
        return simpleBroadcast(data, actor);
    }
}
