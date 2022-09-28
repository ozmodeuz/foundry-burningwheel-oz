var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import * as constants from "../constants.js";
import { gmOnly } from "../decorators.js";
export class DifficultyDialog extends Application {
    constructor(defaultDifficulty, showDifficulty, extendedData) {
        super({
            template: "systems/burningwheel/templates/dialogs/gm-difficulty.hbs",
            classes: ["gm-difficulty"],
            popOut: false
        });
        this.difficulty = defaultDifficulty;
        this.showDifficulty = showDifficulty;
        this.editable = game.user?.isGM || false;
        this.splitPool = this.customDiff = this.help = false;
        this.extendedTest = extendedData?.extendedTest || false;
        this.actorGroups = extendedData?.actorGroups || [];
        $(document).on("keydown", e => {
            if (e.key === "Control" || e.key === "Meta") {
                this.splitPool = true;
                this.render();
            }
            else if (e.key === "Alt") {
                this.help = true;
                this.render(true);
            }
            else if (e.key === "Shift") {
                this.customDiff = true;
                this.render(true);
            }
        });
        $(document).on("keyup", e => {
            if (e.key === "Control" || e.key === "Meta") {
                this.splitPool = false;
                this.render();
            }
            else if (e.key === "Alt") {
                this.help = false;
                this.render(true);
            }
            else if (e.key === "Shift") {
                this.customDiff = false;
                this.render(true);
            }
        });
    }
    activateListeners(html) {
        html.find("input.difficultyInput").on("input", (e) => {
            const input = e.currentTarget;
            const difficulty = parseInt($(input).val());
            this.difficulty = difficulty;
            game.settings.set(constants.systemName, constants.settings.gmDifficulty, difficulty);
            game.socket.emit(constants.socketName, { type: "difficulty", difficulty });
        });
        html.find("#gm-diff-sp").on('change', e => {
            this.splitPool = $(e.target).prop("checked");
        });
        html.find("#gm-diff-custom").on('change', e => {
            this.customDiff = $(e.target).prop("checked");
        });
        html.find("#gm-diff-help").on('change', e => {
            this.help = $(e.target).prop("checked");
        });
        html.find("#gm-ext-test").on('change', e => {
            this.extendedTest = $(e.target).prop("checked");
            this.persistExtendedTestData();
            this.render(true);
        });
        html.find('*[data-action="grant"]').on('click', e => {
            const skillId = e.target.dataset.skillId;
            const path = e.target.dataset.path;
            const actor = game.actors?.get(e.target.dataset.actorId || '');
            const difficulty = e.target.dataset.difficulty;
            const title = e.target.dataset.title || "";
            if (actor) {
                if (skillId) {
                    this.assignDeferredTest({
                        actor,
                        diff: difficulty,
                        skillId,
                        title
                    });
                }
                else {
                    this.assignDeferredTest({
                        actor,
                        diff: difficulty,
                        path,
                        title
                    });
                }
            }
        });
        html.find('button[data-action="clear"]').on('click', _ => {
            this.actorGroups = [];
            this.persistExtendedTestData();
            this.render();
        });
        html.find('button[data-action="clearEntry"]').on('click', e => {
            const id = e.currentTarget.dataset.actorId || "";
            const index = parseInt(e.currentTarget.dataset.index || "0");
            const group = this.actorGroups.find(ag => ag.id === id);
            group?.advancements.splice(index, 1);
            if (group && !group.advancements.length) {
                this.actorGroups.splice(this.actorGroups.indexOf(group), 1);
            }
            this.persistExtendedTestData();
            this.render();
        });
    }
    activateSocketListeners() {
        game.socket.on(constants.socketName, ({ type, difficulty }) => {
            if (type === "difficulty") {
                this.difficulty = difficulty;
                this.render(true);
            }
        });
        game.socket.on(constants.socketName, ({ type, data }) => {
            if (type === "extendedTest") {
                this.extendedTest = data.extendedTest;
                this.actorGroups = data.actorGroups;
                if (game.user?.isGM) {
                    game.settings.set(constants.systemName, constants.settings.extendedTestData, JSON.stringify(data));
                }
                this.render(true);
            }
        });
    }
    persistExtendedTestData() {
        const data = { extendedTest: this.extendedTest, actorGroups: this.actorGroups };
        if (game.user?.isGM) {
            game.settings.set(constants.systemName, constants.settings.extendedTestData, JSON.stringify(data));
        }
        game.socket.emit(constants.socketName, { type: "extendedTest", data });
    }
    addDeferredTest({ actor, path, name, skill, difficulty }) {
        const existingGroup = this.actorGroups.find(ag => ag.id === actor.id);
        const entries = [];
        switch (difficulty) {
            case "Routine":
                entries.push({ title: name.titleCase(), path, skillId: skill?.id, difficulty: "R" });
                break;
            case "Difficult":
                entries.push({ title: name.titleCase(), path, skillId: skill?.id, difficulty: "D" });
                break;
            case "Challenging":
                entries.push({ title: name.titleCase(), path, skillId: skill?.id, difficulty: "C" });
                break;
            case "Routine/Difficult":
                entries.push({ title: name.titleCase(), path, skillId: skill?.id, difficulty: "R" });
                entries.push({ title: name.titleCase(), path, skillId: skill?.id, difficulty: "D" });
                break;
        }
        if (!existingGroup) {
            // there's no entry for this actor yet
            this.actorGroups.push({
                name: actor.name,
                id: actor.id,
                advancements: entries
            });
        }
        else {
            // merge entries without duplication
            existingGroup.advancements = existingGroup.advancements.concat(entries.filter(e => !existingGroup.advancements.find(a => a.title === e.title && a.difficulty === e.difficulty)));
            existingGroup.advancements.sort((a, b) => {
                return a.title.localeCompare(b.title) === 0 ? a.difficulty.localeCompare(b.difficulty) : a.title.localeCompare(b.title);
            });
        }
        this.persistExtendedTestData();
        this.render();
    }
    assignDeferredTest({ actor, diff, skillId, path, title }) {
        if (actor) {
            const difficulty = diff === "R" ? "Routine" : (diff === "C" ? "Challenging" : "Difficult");
            if (skillId) {
                const skill = actor.items.get(skillId);
                if (skill) {
                    skill.addTest(difficulty, true);
                }
            }
            else if (path) {
                const stat = getProperty(actor.data, path);
                if (["data.power", "data.will", "data.perception", "data.agility", "data.forte", "data.speed"].includes(path)) {
                    actor.addStatTest(stat, title, path, difficulty, true, false, true);
                }
                else {
                    actor.addAttributeTest(stat, title, path, difficulty, true, true);
                }
            }
            const group = this.actorGroups.find(ag => ag.id === actor.id);
            group.advancements = group.advancements.filter(a => a.title !== title);
            if (!group.advancements.length) {
                this.actorGroups.splice(this.actorGroups.indexOf(group), 1);
            }
            this.persistExtendedTestData();
            this.render();
        }
    }
    getData() {
        const data = super.getData();
        data.difficulty = this.difficulty;
        data.editable = this.editable;
        data.splitPool = this.splitPool;
        data.help = this.help;
        data.customDiff = this.customDiff;
        data.extendedTest = this.extendedTest;
        data.actorGroups = this.actorGroups;
        data.showDifficulty = this.showDifficulty;
        return data;
    }
}
__decorate([
    gmOnly
], DifficultyDialog.prototype, "assignDeferredTest", null);
