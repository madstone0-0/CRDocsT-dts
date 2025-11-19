export class CTNode {
    uid: string; //userId @ lamport timestamp
    character?: string;
    cause?: CTNode; //the causal prior?

    constructor(uid: string) {
        this.uid = uid;
    }
}
