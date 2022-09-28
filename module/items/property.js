import { BWItem } from "./item.js";
export class Property extends BWItem {
    prepareData() {
        super.prepareData();
        this.data.data.cssClass = "equipment-property";
    }
}
