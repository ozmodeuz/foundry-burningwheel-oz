import { BWActor } from "./BWActor.js";
export class Npc extends BWActor {
    prepareData() {
        super.prepareData();
        this.calculateWounds();
    }
    calculateWounds() {
        this.data.data.ptgs.woundDice =
            (this.data.data.ptgs.suTaken >= 3 ? 1 : 0) +
                (this.data.data.ptgs.liTaken) +
                (this.data.data.ptgs.miTaken * 2) +
                (this.data.data.ptgs.seTaken * 3) +
                (this.data.data.ptgs.trTaken * 4);
        this.data.data.ptgs.obPenalty =
            (this.data.data.ptgs.suTaken > 0 && this.data.data.ptgs.suTaken < 3) ? 1 : 0;
    }
}
