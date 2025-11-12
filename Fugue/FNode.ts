class FNode<P> {
    value?: string;
    position: P;

    constructor(position: P, value?: string) {
        this.value = value;
        this.position = position;
    }
}

export default FNode;
