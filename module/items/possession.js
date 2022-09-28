import { BWItem } from "./item.js";
export class Possession extends BWItem {
    prepareData() {
        super.prepareData();
        this.data.data.cssClass = "equipment-possession";
    }
}
