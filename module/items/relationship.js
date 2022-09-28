import { BWItem } from "./item.js";
export class Relationship extends BWItem {
    prepareData() {
        super.prepareData();
        this.data.data.safeId = this.id;
        if (this.actor && this.actor.data) {
            this.data.data.aptitude = this.actor.data.data.circles.exp || 0;
        }
        if (this.data.data.hateful || this.data.data.enmity) {
            this.data.data.cssClass = "relationship-hostile";
        }
        else if (this.data.data.romantic || this.data.data.immediateFamily) {
            this.data.data.cssClass = "relationship-friendly";
        }
        else {
            this.data.data.cssClass = "relationship-neutral";
        }
    }
}
