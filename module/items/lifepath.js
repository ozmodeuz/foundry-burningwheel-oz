import { BWItem } from "./item.js";
export class Lifepath extends BWItem {
    get type() {
        return super.type;
    }
    prepareData() {
        super.prepareData();
        const statSign = this.data.data.statBoost === "none" ? "" : (this.data.data.subtractStats ? "-" : "+");
        this.data.data.statString = statSign + statMap[this.data.data.statBoost];
    }
}
const statMap = {
    "none": "&mdash;",
    "mental": "1 M",
    "physical": "1 P",
    "either": "1 M/P",
    "both": "1 M,P"
};
