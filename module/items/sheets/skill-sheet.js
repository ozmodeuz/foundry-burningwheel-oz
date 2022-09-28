import { skillTypeSelect } from "../../constants.js";
import { BWItemSheet } from "./bwItemSheet.js";
export class SkillSheet extends BWItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {});
    }
    get template() {
        return "systems/burningwheel/templates/items/skill.hbs";
    }
    getData() {
        const data = super.getData();
        data.skillTypes = skillTypeSelect;
        data.skillRoots = {};
        Object.assign(data.skillRoots, this.item.getRootSelect());
        return data;
    }
}
