import UniquelyDenseTotalOrder from "./UniquelyDenseTotalOrder";

export default class StringTotalOrder implements UniquelyDenseTotalOrder<string> {
    readonly replicaID: string;
    private counter = 0;

    compare(a: string, b: string): number {
        return a.localeCompare(b);
    }

    constructor(replicaID: string) {
        this.replicaID = replicaID;
    }

    createBetween(a?: string, b?: string): string {
        // Create a wholly unique string using a causal dot, i.e. (replicaID, counter)
        const uniqueStr = `${this.replicaID}${this.counter++}`;

        // If node is the first ever position in the document
        if (!a && !b) {
            return uniqueStr + "R";
        }

        // If node is the first position at that index
        if (!a) {
            return b + uniqueStr + "R";
        }

        // If node is the last position at that index
        if (!b) {
            return a + uniqueStr + "R";
        }

        const isAPrefixOfB = b.substring(0, a.length).localeCompare(a);
        // If a is not a prefix of b append a globally unique new string to a and return that +R
        if (!isAPrefixOfB) {
            return a + uniqueStr + "R";
        } else {
            // If a is a prefix of b replace the R at the end of b with L.
            // Then append a globally unique string to it and return it  +R.
            return b.slice(0, -1) + "L" + uniqueStr + "R";
        }
    }
}
