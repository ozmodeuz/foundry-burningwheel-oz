var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { changesState, ExtendedTestDialog } from "./ExtendedTestDialog.js";
export class RangeAndCoverDialog extends ExtendedTestDialog {
    constructor(d, o) {
        super(d, o);
        this.data.topic = "range-and-cover";
        this.data.settingName = "rnc-data";
        this.data.data.memberIds = this.data.data.memberIds || [];
        this.data.data.teams = this.data.data.teams || [];
    }
    get template() {
        return "systems/burningwheel/templates/dialogs/range-and-cover.hbs";
    }
    activateSocketListeners() {
        super.activateSocketListeners();
    }
    activateListeners(html) {
        super.activateListeners(html);
        html.find('input[name="showV1"], input[name="showV2"], input[name="showV3"]').on('change', (e) => this.propagateChange(e));
        html.find('select[name="newTeam"]').on('change', (e) => this._addNewTeam(e.target));
        html.find('select[name="newMember"]').on('change', (e) => this._addNewMember(e.target));
        html.find('*[data-action="delete-member"]').on('click', (e) => this._deleteMember(e.target));
        html.find('*[data-action="toggle-hidden"]').on('click', (e) => this._toggleHidden(e.target));
        html.find('.team-grid select, .team-card input').on('change', (e) => this.updateCollection(e, this.data.data.teams));
        html.find('*[data-action="resetRound"]').on('click', (e) => this._resetRound(e));
        html.find('*[data-action="clearAll"]').on('click', (e) => this._clearAll(e));
    }
    _clearAll(e) {
        e.preventDefault();
        this.data.data.actors = [];
        this.data.data.teams = [];
        this.data.data.showV1 = this.data.data.showV2 = this.data.data.showV3 = false;
        this.data.data.memberIds = [];
    }
    _resetRound(e) {
        e.preventDefault();
        this.data.data.teams.forEach(t => {
            t.action1 = t.action2 = t.action3 = "Do Nothing";
        });
        this.data.data.showV1 = this.data.data.showV2 = this.data.data.showV3 = false;
    }
    _toggleHidden(target) {
        const index = parseInt(target.dataset.index || "0");
        const team = this.data.data.teams[index];
        team.hideActions = !team.hideActions;
    }
    _addNewTeam(target) {
        const id = target.value;
        const actor = this.data.actors.find(a => a.id === id);
        this.data.data.teams.push({
            members: [{ id, name: actor.name }],
            range: "Optimal",
            hideActions: false,
            action1: "Do Nothing",
            action2: "Do Nothing",
            action3: "Do Nothing",
            strideDice: 0,
            positionDice: 0,
            weaponDice: 0,
            miscDice: 0
        });
        if (actor.data.type === "character") {
            // ensure only one character can be added at once.
            // reusing npcs is probably fine.
            this.data.data.memberIds.push(id);
        }
    }
    _addNewMember(target) {
        const id = target.value;
        const index = parseInt(target.dataset.index || "0");
        const team = this.data.data.teams[index];
        const actor = this.data.actors.find(a => a.id === id);
        team.members.push({ id: actor.id, name: actor.name });
        if (actor.data.type === "character") {
            this.data.data.memberIds.push(id);
        }
    }
    _deleteMember(target) {
        const teamIndex = parseInt(target.dataset.index || "0");
        const memberIndex = parseInt(target.dataset.memberIndex || "0");
        const team = this.data.data.teams[teamIndex];
        const deleted = team.members.splice(memberIndex, 1);
        if (team.members.length === 0) {
            this.data.data.teams.splice(teamIndex, 1);
        }
        if (this.data.actors.find(a => a.id === deleted[0].id)?.data.type === "character") {
            this.data.data.memberIds.splice(this.data.data.memberIds.indexOf(deleted[0].id), 1);
        }
    }
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            width: 1000,
            height: 600,
            resizable: true,
            classes: ["rnc", "bw-app"]
        }, { overwrite: true });
    }
    static addSidebarControl(html) {
        const buttonElement = document.createElement("button");
        buttonElement.textContent = "Range and Cover";
        buttonElement.className = "rnc-sidebar-button";
        buttonElement.onclick = () => game.burningwheel.rangeAndCover.render(true);
        const combatHeader = $(html).find("header");
        combatHeader.prepend(buttonElement);
    }
    getData() {
        const data = super.getData();
        data.actionOptions = options;
        if (!this.data.actors) {
            this.data.actors = game.actors?.contents;
        }
        data.actors = this.data.actors.filter(a => !this.data.data.memberIds.includes(a.id));
        data.gmView = game.user?.isGM || false;
        data.teams.forEach(t => {
            const actorData = t.members.map(m => m.id).map(id => this.data.actors.find(a => a.id === id));
            t.editable = (data.gmView && !t.hideActions) || (!data.gmView && actorData.some(a => a.isOwner));
            t.showAction1 = data.showV1 || t.editable;
            t.showAction2 = data.showV2 || t.editable;
            t.showAction3 = data.showV3 || t.editable;
        });
        return data;
    }
}
__decorate([
    changesState()
], RangeAndCoverDialog.prototype, "_clearAll", null);
__decorate([
    changesState()
], RangeAndCoverDialog.prototype, "_resetRound", null);
__decorate([
    changesState()
], RangeAndCoverDialog.prototype, "_toggleHidden", null);
__decorate([
    changesState()
], RangeAndCoverDialog.prototype, "_addNewTeam", null);
__decorate([
    changesState()
], RangeAndCoverDialog.prototype, "_addNewMember", null);
__decorate([
    changesState()
], RangeAndCoverDialog.prototype, "_deleteMember", null);
const options = {
    "Move In": [
        "Close", "Sneak In", "Flank", "Charge"
    ],
    "Hold Ground": [
        "Maintain Distance", "Hold Position"
    ],
    "Move Out": [
        "Withdraw", "Sneak Out", "Fall Back", "Retreat"
    ],
    "Hesitation Actions": [
        "Fall Prone", "Run Screaming", "Stand & Drool", "Swoon"
    ]
};
