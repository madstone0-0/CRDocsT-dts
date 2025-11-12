/**
 * Helper interface for sorting and creating unique immutable positions,
 * suitable for use in a List CRDT. Taken from mattweidner.com/2022/10/21/basic-list-crdt.html
 *
 * @type P The type of positions. Treated as immutable.
 */
export interface UniquelyDenseTotalOrder<P> {
    /**
     * Usual compare function for sorts: returns negative if a < b in
     * their sort order, positive if a > b.
     */
    compare(a: P, b: P): number;

    /**
     * Returns a globally unique new position c such that a < c < b.
     *
     * "Globally unique" means that the created position must be distinct
     * from all other created positions, including ones created concurrently
     * by other users.
     *
     * When a is undefined, it is treated as the start of the list, i.e.,
     * this returns c such that c < b. Likewise, undefined b is treated
     * as the end of the list.
     */
    createBetween(a?: P, b?: P): P;
}

export class StringTotalOrder implements UniquelyDenseTotalOrder<string> {
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

export function randomString(length: number = 10): string {
    let res = new Array<string>(length);
    for (let i = 0; i < length; i++) res[i] = String.fromCharCode(97 + Math.floor(Math.random() * 26));
    return res.join("");
}
