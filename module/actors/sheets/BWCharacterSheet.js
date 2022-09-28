import { BWActorSheet } from "./BWActorSheet.js";
import * as constants from "../../constants.js";
import { handleRollable } from "../../rolls/rolls.js";
import { CharacterBurnerDialog } from "../../dialogs/CharacterBurnerDialog.js";
import { addNewItem } from "../../dialogs/ImportItemDialog.js";
import { byName } from "../../helpers.js";
import { Skill } from "../../items/skill.js";
export class BWCharacterSheet extends BWActorSheet {
    get actor() {
        return super.actor;
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.draggableItemSelectors = [
            '.skills > .rollable',
            '.learning-section > .learning',
            '.spell-section > .spell-section-item',
            '.relationships > .relationship',
            '.reputations > .reputation',
            '.affiliations > .affiliation',
            '.gear > div',
            '.trait-category > .trait',
            '.bits-artha'
        ];
        options.draggableMeleeSelectors = [
            '.weapon-grid .rollable',
            '.weapon-grid > .weapon-name'
        ];
        options.draggableRangedSelectors = [
            '.ranged-grid .rollable',
            '.ranged-grid > .weapon-name'
        ];
        options.draggableStatSelectors = [
            '.stats > .rollable',
            '.attributes > .rollable'
        ];
        return options;
    }
    getData() {
        const data = super.getData();
        const woundDice = this.actor.data.data.ptgs.woundDice;
        const items = this.actor.items.values();
        const beliefs = [];
        const instincts = [];
        const traits = [];
        const skills = [];
        const training = [];
        const learning = [];
        const relationships = [];
        const equipment = [];
        const melee = [];
        const ranged = [];
        const armor = [];
        const reps = [];
        const affs = [];
        const spells = [];
        let addFist = true; // do we need to add a fist weapon?
        for (const value of items) {
            const i = value.data;
            switch (i.type) {
                case "reputation":
                    reps.push(i);
                    break;
                case "affiliation":
                    affs.push(i);
                    break;
                case "belief":
                    beliefs.push(i);
                    break;
                case "instinct":
                    instincts.push(i);
                    break;
                case "trait":
                    traits.push(i);
                    break;
                case "skill":
                    const s = i;
                    if (s.data.learning) {
                        learning.push(s);
                    }
                    else if (s.data.training) {
                        training.push(s);
                    }
                    else {
                        skills.push(s);
                    }
                    Skill.disableIfWounded.call(i, woundDice);
                    break;
                case "relationship":
                    relationships.push(i);
                    break;
                case "melee weapon":
                    if (addFist && i.name === "Bare Fist") {
                        addFist = false; // only add one fist weapon if none present
                    }
                    else {
                        equipment.push(i); // don't count fists as equipment
                    }
                    melee.push(i);
                    break;
                case "ranged weapon":
                    equipment.push(i);
                    ranged.push(i);
                    break;
                case "armor":
                    equipment.push(i);
                    armor.push(i);
                    break;
                case "spell":
                    spells.push(i);
                    break;
                default:
                    equipment.push(i);
            }
        }
        data.beliefs = beliefs;
        data.instincts = instincts;
        data.skills = skills.sort(byName);
        data.learning = learning.sort(byName);
        data.training = training.sort(byName);
        data.relationships = relationships.sort(byName);
        data.equipment = equipment.sort(equipmentCompare);
        data.melee = melee.sort(weaponCompare);
        data.armor = this.getArmorDictionary(armor);
        data.ranged = ranged.sort(weaponCompare);
        data.reputations = reps.sort(byName);
        data.affiliations = affs.sort(byName);
        data.spells = spells.sort(byName);
        const traitLists = { character: [], die: [], callon: [] };
        if (traits.length !== 0) {
            traits.forEach((trait) => {
                switch (trait.data.traittype) {
                    case "character":
                        traitLists.character.push(trait);
                        break;
                    case "die":
                        traitLists.die.push(trait);
                        break;
                    default:
                        traitLists.callon.push(trait);
                        break;
                }
            });
            traitLists.callon.sort(byName);
            traitLists.character.sort(byName);
            traitLists.die.sort(byName);
        }
        data.traits = traitLists;
        data.systemVersion = game.system.data.version;
        return data;
    }
    activateListeners(html) {
        // add/delete buttons
        const selectors = [
            '.bits-item .bits-item-name[data-action="editItem"]',
            'i[data-action="editItem"]',
            'i[data-action="delItem"]',
            'i[data-action="addAffiliation"]',
            'i[data-action="addRelationship"]',
            'i[data-action="addReputation"]',
            'i[data-action="addBelief"]',
            'i[data-action="addInstinct"]',
            'i[data-action="addTrait"]',
            '*[data-action="addSkill"]',
            '*[data-action="addSpell"]',
            '*[data-action="learnSpell"]',
            '*[data-action="addGear"]',
            '*[data-action="broadcast"]'
        ];
        html.find(selectors.join(", ")).on("click", e => this._manageItems(e));
        // roll macros
        html.find("button.rollable").on("click", e => handleRollable(e, this));
        html.find("i[data-action=\"refresh-ptgs\"]").on("click", _e => this.actor.updatePtgs());
        html.find('*[data-action="learn-skill"]').on("click", e => this.learnNewSkill(e, this.actor));
        html.find('label.character-burner-icon').on("click", _e => CharacterBurnerDialog.Open(this.actor));
        super.activateListeners(html);
    }
    async learnNewSkill(e, actor) {
        e.preventDefault();
        return addNewItem({
            actor: actor,
            searchTitle: "Learn New Skill",
            itemType: "skill",
            itemDataLeft: (i) => i.data.data.restrictions.titleCase(),
            itemDataMid: (i) => i.data.data.skilltype.titleCase(),
            baseData: {
                learning: true,
                root1: "perception",
                skilltype: "special",
                img: constants.defaultImages.skill
            },
            forcedData: {
                learning: true
            },
            img: constants.defaultImages.skill
        });
    }
    async _manageItems(e) {
        e.preventDefault();
        const t = e.currentTarget;
        const action = $(t).data("action");
        const id = $(t).data("id");
        let options;
        switch (action) {
            case "broadcast":
                const item = this.actor.items.get(id);
                if (item) {
                    return item.generateChatMessage(this.actor);
                }
                break;
            case "addBelief":
                options = { name: "New Belief", type: "belief", data: {}, img: constants.defaultImages.belief };
                return this.actor.createEmbeddedDocuments("Item", [options]).then(i => this.actor.items.get(i[0].id)?.sheet?.render(true));
            case "addInstinct":
                options = { name: "New Instinct", type: "instinct", data: {}, img: constants.defaultImages.belief };
                return this.actor.createEmbeddedDocuments("Item", [options]).then(i => this.actor.items.get(i[0].id)?.sheet?.render(true));
            case "addRelationship":
                options = { name: "New Relationship", type: "relationship", data: { building: true }, img: constants.defaultImages.relationship };
                return this.actor.createEmbeddedDocuments("Item", [options]).then(i => this.actor.items.get(i[0].id)?.sheet?.render(true));
            case "addReputation":
                options = { name: "New Reputation", type: "reputation", data: {}, img: constants.defaultImages.reputation };
                return this.actor.createEmbeddedDocuments("Item", [options]).then(i => this.actor.items.get(i[0].id)?.sheet?.render(true));
            case "addAffiliation":
                options = { name: "New Affiliation", type: "affiliation", data: {}, img: constants.defaultImages.affiliation };
                return this.actor.createEmbeddedDocuments("Item", [options]).then(i => this.actor.items.get(i[0].id)?.sheet?.render(true));
            case "addSkill":
                return addNewItem({
                    actor: this.actor,
                    searchTitle: "Add New Skill",
                    itemType: "skill",
                    itemDataLeft: (i) => i.data.data.restrictions.titleCase(),
                    itemDataMid: (i) => i.data.data.skilltype.titleCase(),
                    baseData: { root1: "perception", skilltype: "special" },
                    popupMessage: "Add a new skill to the character sheet.  "
                        + "Note this is different than learning a new skill via the beginner's luck rules.  "
                        + "Check the learning section if you want to begin learning the skill.",
                    img: constants.defaultImages.skill
                });
            case "addTrait":
                return addNewItem({
                    actor: this.actor,
                    searchTitle: "Add New Trait",
                    itemType: "trait",
                    itemDataLeft: (i) => i.data.data.restrictions.titleCase(),
                    itemDataMid: (i) => i.data.data.traittype.titleCase(),
                    baseData: { traittype: id },
                    img: constants.defaultImages[id]
                });
            case "addSpell":
                return addNewItem({
                    actor: this.actor,
                    searchTitle: "Add New Spell",
                    itemType: "spell",
                    itemDataLeft: (i) => `Origin: ${i.data.data.origin.titleCase()}`,
                    itemDataMid: (i) => `Impetus: ${i.data.data.impetus.titleCase()}`,
                    baseData: {},
                    img: constants.defaultImages.spell
                });
            case "learnSpell":
                return addNewItem({
                    actor: this.actor,
                    searchTitle: "Learn New Spell",
                    itemType: "spell",
                    itemDataLeft: (i) => `Origin: ${i.data.data.origin.titleCase()}`,
                    itemDataMid: (i) => `Impetus: ${i.data.data.impetus.titleCase()}`,
                    baseData: { inPracticals: true },
                    forcedData: {
                        inPracticals: true
                    },
                    img: constants.defaultImages.spell
                });
            case "addGear":
                return addNewItem({
                    actor: this.actor,
                    searchTitle: "Add New Gear",
                    itemTypes: ["melee weapon", "ranged weapon", "armor", "possession", "property"],
                    itemDataLeft: (_) => "",
                    itemDataMid: (i) => `Type: ${i.type.titleCase()}`,
                    baseData: { traittype: id },
                    img: constants.defaultImages[id]
                });
            case "delItem":
                return Dialog.confirm({
                    title: "Confirm Deletion",
                    content: "<p>You are about to delete an item from the actor's sheet. Are you sure?</p>",
                    yes: () => this.actor.deleteEmbeddedDocuments("Item", [id]),
                    no: () => void 0
                });
            case "editItem":
                return this.actor.items.get(id)?.sheet?.render(true);
        }
        return null;
    }
}
function equipmentCompare(a, b) {
    if (constants.equipmentSheetOrder[a.type] !== constants.equipmentSheetOrder[b.type]) {
        return constants.equipmentSheetOrder[a.type] > constants.equipmentSheetOrder[b.type] ? 1 : -1;
    }
    return a.name.localeCompare(b.name);
}
function weaponCompare(a, b) {
    if (a.name === "Bare Fist") {
        return -1;
    }
    if (b.name === "Bare Fist") {
        return 1;
    }
    return a.name.localeCompare(b.name);
}
