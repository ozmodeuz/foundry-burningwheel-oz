var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { changesState, ExtendedTestDialog } from "./ExtendedTestDialog.js";
import { handleLearningRoll } from "../rolls/rollLearning.js";
import { handleSkillRoll } from "../rolls/rollSkill.js";
import { handleNpcSkillRoll } from "../rolls/npcSkillRoll.js";
import { getKeypressModifierPreset } from "../rolls/rolls.js";
import * as constants from "../constants.js";
export class DuelOfWitsDialog extends ExtendedTestDialog {
    constructor(d, o) {
        super(d, o);
        this.data.actionOptions = options;
        this.data.data.showV1 = this.data.data.showV1 || false;
        this.data.data.showV2 = this.data.data.showV2 || false;
        this.data.data.showV3 = this.data.data.showV3 || false;
        this.data.data.blindS1 = this.data.data.blindS1 || false;
        this.data.data.blindS2 = this.data.data.blindS2 || false;
        this.data.topic = "Duel";
        this.data.settingName = constants.settings.duelData;
    }
    get template() {
        return "systems/burningwheel/templates/dialogs/duel-of-wits.hbs";
    }
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, { width: 600, height: 600, resizable: true, classes: ["bw-app"] }, { overwrite: true });
    }
    activateListeners(html) {
        super.activateListeners(html);
        html.find("input, select, textarea").on('change', (e) => this.propagateChange(e));
        html.find("button[data-action='reset-round']").on('click', (_) => this.clearRound());
        html.find("button[data-action='reset-everything']").on('click', (_) => this.clearEverything());
        html.find("button[data-action='roll-dow']").on('click', (e) => this._handleRoll(e));
    }
    _handleRoll(e) {
        e.preventDefault();
        const dataPreset = getKeypressModifierPreset(e);
        dataPreset.offerSplitPool = true;
        const target = e.currentTarget;
        if (target.dataset.actorId === "") {
            return;
        }
        if (target.dataset.skillId === "") {
            return;
        }
        const actor = game.actors?.contents.find(a => a.id === target.dataset.actorId);
        const skill = actor?.items.get(target.dataset.skillId || "");
        dataPreset.deedsPoint = actor.data.data.deeds !== 0;
        if (actor.data.data.persona) {
            dataPreset.personaOptions = Array.from(Array(Math.min(actor.data.data.persona, 3)).keys());
        }
        if (!skill) {
            return;
        }
        if (actor?.data.type === "character") {
            if (skill.data.data.learning) {
                handleLearningRoll({
                    actor: actor,
                    skill,
                    dataPreset
                });
            }
            else {
                handleSkillRoll({
                    actor: actor,
                    skill,
                    dataPreset
                });
            }
        }
        else {
            // handle roll as npc
            handleNpcSkillRoll({
                actor: actor,
                skill,
                dataPreset
            });
        }
    }
    getData() {
        const data = super.getData();
        const actors = game.actors?.contents || [];
        data.actionOptions = this.data.actionOptions;
        data.side1Options = actors.filter(a => a.id !== data.side2ActorId);
        data.side2Options = actors.filter(a => a.id !== data.side1ActorId);
        data.actor1 = actors.find(a => a.id === data.side1ActorId);
        data.actor1Skills = (data.actor1?.data.socialSkills || []).map((s) => { return { id: s._id, label: s.name }; });
        data.actor2 = actors.find(a => a.id === data.side2ActorId);
        data.actor2Skills = (data.actor2?.data.socialSkills || []).map((s) => { return { id: s._id, label: s.name }; });
        data.side1ReadOnly = !data.actor1 || !data.actor1.isOwner;
        data.side2ReadOnly = !data.actor2 || !data.actor2.isOwner;
        data.gmView = game.user?.isGM || false;
        data.showS1Select = (data.gmView && !data.blindS1) || (!data.side1ReadOnly && !data.gmView);
        data.showS2Select = (data.gmView && !data.blindS2) || (!data.side2ReadOnly && !data.gmView);
        data.showV1S1Card = data.showV1 || (data.gmView && !data.blindS1) || (!data.side1ReadOnly && !data.gmView);
        data.showV1S2Card = data.showV1 || (data.gmView && !data.blindS2) || (!data.side2ReadOnly && !data.gmView);
        data.showV2S1Card = data.showV2 || (data.gmView && !data.blindS1) || (!data.side1ReadOnly && !data.gmView);
        data.showV2S2Card = data.showV2 || (data.gmView && !data.blindS2) || (!data.side2ReadOnly && !data.gmView);
        data.showV3S1Card = data.showV3 || (data.gmView && !data.blindS1) || (!data.side1ReadOnly && !data.gmView);
        data.showV3S2Card = data.showV3 || (data.gmView && !data.blindS2) || (!data.side2ReadOnly && !data.gmView);
        return data;
    }
    async clearEverything() {
        await this.clearRound();
        const data = this.data.data;
        data.blindS1 = false;
        data.blindS2 = false;
        data.boa1 = 0;
        data.boa1Max = 0;
        data.boa2 = 0;
        data.boa2Max = 0;
        data.side1ActorId = "";
        data.side2ActorId = "";
        data.statement1 = "";
        data.statement2 = "";
        data.actor1Skill = "";
        data.actor2Skill = "";
    }
    async clearRound() {
        const data = this.data.data;
        data.v1s1 = "?";
        data.v1s2 = "?";
        data.v2s1 = "?";
        data.v2s2 = "?";
        data.v3s1 = "?";
        data.v3s2 = "?";
        data.showV1 = false;
        data.showV2 = false;
        data.showV3 = false;
    }
    static addSidebarControl(html) {
        const buttonElement = document.createElement("button");
        buttonElement.textContent = "Duel of Wits";
        buttonElement.className = "dow-sidebar-button";
        buttonElement.onclick = () => game.burningwheel.dow.render(true);
        const combatHeader = $(html).find("header");
        combatHeader.prepend(buttonElement);
    }
}
__decorate([
    changesState()
], DuelOfWitsDialog.prototype, "clearEverything", null);
__decorate([
    changesState()
], DuelOfWitsDialog.prototype, "clearRound", null);
const options = {
    "Verbal Attack": [
        "Point", "Dismiss"
    ],
    "Verbal Defense": [
        "Avoid", "Obfuscate", "Rebuttal"
    ],
    "Verbal Special": [
        "Feint", "Incite"
    ],
    "Magic": [
        "Cast Spell", "Command Spirit", "Drop Spell", "Sing, Howl, Pray"
    ],
    "Hesitation": [
        "Fall Prone", "Run Screaming", "Stand & Drool", "Swoon"
    ]
};
