import { BWItem } from "./item.js";
export class Reputation extends BWItem {
    prepareData() {
        super.prepareData();
        this.data.data.cssClass = this.data.data.infamous ? "reputation-infamous" : "reputation-famous";
    }
}
