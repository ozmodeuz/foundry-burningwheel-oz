var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { difficultyGroup } from "../helpers.js";
import * as constants from "../constants.js";
import { simpleBroadcast } from "../chat.js";
import { gmOnly } from "../decorators.js";
export class ModifierDialog extends Application {
    constructor(mods, help) {
        super({
            template: "systems/burningwheel/templates/dialogs/mods-and-help.hbs",
            popOut: false,
        });
        this.mods = mods || [];
        this.help = help || [];
    }
    addHelp({ dice, skillId, path, title, actor, helpedWith }) {
        const entry = {
            title,
            dice: dice >= 5 ? 2 : 1,
            skillId,
            path,
            actorId: actor.id,
            helpedWith
        };
        if (this.help.some(e => e.actorId === actor.id)) {
            return; // each person can only help once.
        }
        this.help.push(entry);
        this.persistData();
        this.syncData();
        this.render();
    }
    grantTests(obstacle, success) {
        if (game.user?.isGM) {
            // the GM is allowed to modify all characters so have them assign the tests and send out the message.
            this._grantTests(obstacle, success);
        }
        else {
            // if we're not the GM, just send a message over the socket that advancement needs to be handed out.
            game.socket.emit(constants.socketName, { type: "grantHelpTests", obstacle, success });
        }
    }
    _grantTests(obstacle, success) {
        const testListing = [];
        this.help.forEach((entry) => {
            let name = "";
            let diff = "Routine";
            const actor = game.actors?.get(entry.actorId);
            if (actor.data.type === "character") {
                if (entry.path) {
                    name = entry.path.substr(entry.path.indexOf('.') + 1).titleCase();
                    const ability = getProperty(actor.data, entry.path);
                    diff = difficultyGroup(ability.exp, obstacle);
                    if (name === "Custom1" || name === "Custom2") {
                        name = ability.name || name;
                    }
                    actor.addStatTest(ability, name, entry.path, diff, success);
                }
                else {
                    const skill = game.actors?.get(entry.actorId)?.items.get(entry.skillId || "");
                    diff = difficultyGroup(skill.data.data.exp, obstacle);
                    skill.addTest(diff);
                    name = skill.name;
                }
            }
            testListing.push({
                title: entry.title,
                text: `A ${diff} ${name} test at Ob ${obstacle}`
            });
        });
        this.help = [];
        this.persistData();
        this.syncData();
        this.render();
        if (testListing.length) {
            simpleBroadcast({
                title: "Tests Granted for Helping",
                mainText: "For their assistance in the test, the following tests have been granted.",
                extraData: testListing
            });
        }
    }
    get helpDiceTotal() {
        return this.help.map(h => h.dice).reduce((t, d) => t + d, 0);
    }
    activateListeners(html) {
        html.find('input[name="newMod"]').on('change', e => {
            const target = $(e.target);
            const name = target.val();
            target.val("");
            this.mods.push({ name, amount: 0 });
            this.render();
        });
        html.find('input.mod-name').on('change', e => {
            const target = $(e.target);
            const name = target.val();
            const index = parseInt(e.target.dataset.index || "0");
            if (name) {
                this.mods[index].name = name;
            }
            else {
                this.mods.splice(index, 1);
            }
            this.persistData();
            this.syncData();
            this.render();
        });
        html.find('input.mod-amount').on('change', e => {
            const target = $(e.target);
            const amount = parseInt(target.val()) || 0;
            const index = parseInt(e.target.dataset.index || "0");
            this.mods[index].amount = amount;
            this.persistData();
            this.syncData();
            this.render();
        });
        html.find('i[data-action="delete"]').on('click', e => {
            const target = e.currentTarget;
            const index = parseInt(target.dataset.index || "0");
            this.help.splice(index, 1);
            this.persistData();
            this.syncData();
            this.render();
        });
    }
    activateSocketListeners() {
        game.socket.on(constants.socketName, ({ type, mods, help }) => {
            if (type === "modifierData") {
                this.mods = mods;
                this.help = help;
                this.persistData();
                this.render(true);
            }
        });
        game.socket.on(constants.socketName, ({ type, obstacle, success }) => {
            if (type === "grantHelpTests" && game.user?.isGM) {
                this._grantTests(obstacle, success);
            }
        });
    }
    persistData() {
        game.settings.set(constants.systemName, constants.settings.obstacleList, JSON.stringify({
            mods: this.mods,
            help: this.help
        }));
    }
    syncData() {
        game.socket.emit(constants.socketName, {
            type: "modifierData",
            mods: this.mods,
            help: this.help
        });
    }
    getData() {
        const data = super.getData();
        data.editable = game.user?.isGM || false;
        data.modifiers = this.mods;
        data.help = this.help;
        data.showHelp = this.help.length > 0;
        return data;
    }
}
__decorate([
    gmOnly
], ModifierDialog.prototype, "_grantTests", null);
__decorate([
    gmOnly
], ModifierDialog.prototype, "persistData", null);
