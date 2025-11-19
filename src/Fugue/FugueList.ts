import { FNode } from "./FNode";
import { FugueState } from "../types/Fugue";
import { UniquelyDenseTotalOrder } from "../TotalOrder/UniquelyDenseTotalOrder";
import { FugueMessage, Operation } from "../types/Message";

/**
 * A Fugue List CRDT, with insert and delete operations
 */
export class FugueList<P> {
    state: FugueState<P> = [];
    totalOrder: UniquelyDenseTotalOrder<P>;
    positionCounter = 0;
    ws: WebSocket | null;

    constructor(totalOrder: UniquelyDenseTotalOrder<P>, ws: WebSocket | null) {
        this.totalOrder = totalOrder;
        this.ws = ws;
    }

    private propagate(msg: FugueMessage) {
        if (!this.ws) return;

        this.ws.send(JSON.stringify(msg));
    }

    /**
     * Inserts new element with 'value' at 'index' in the list
     * @param index - Index to insert 'value' at
     * @param value - Value to insert
     */
    insert(index: number, value: string) {
        if (index >= this.state.length) this.state.push([]);

        let i = this.state.length - 1;
        while (i > index) {
            this.state[i] = this.state[i - 1];
            i--;
        }

        const atIndex = this.state[index];
        if (index > 0 && index < this.state.length - 1) {
            const before = this.state[index - 1];
            const after = this.state[index + 1];
            if (atIndex.length == 0) {
                atIndex.push(new FNode<P>(this.totalOrder.createBetween(before[before.length - 1].position), value));
            } else {
                const a = atIndex[atIndex.length - 1];
                atIndex.push(
                    new FNode<P>(this.totalOrder.createBetween(a.position, after[after.length - 1].position), value),
                );
            }
        } else {
            if (atIndex.length == 0) {
                atIndex.push(new FNode<P>(this.totalOrder.createBetween(), value));
            } else {
                const a = atIndex[atIndex.length - 1];
                atIndex.push(new FNode<P>(this.totalOrder.createBetween(a.position), value));
            }
        }

        // Send to replicas
        this.propagate({
            replicaId: this.totalOrder.getReplicaId(),
            operation: Operation.INSERT,
            position: index,
            data: value,
        });
    }

    /**
     * Delete value in the list at index
     * @param index - Index of the value to delete
     */
    delete(index: number) {
        let i = index;
        while (i < this.state.length) {
            this.state[i] = this.state[i + 1];
            i++;
        }
        this.state.pop();

        // Send to replicas
        this.propagate({
            replicaId: this.totalOrder.getReplicaId(),
            operation: Operation.DELETE,
            position: index,
            data: null,
        });
    }

    observe(): string {
        let res = new String();
        for (const idx of this.state) {
            if (idx.length > 1) {
                res += idx
                    .sort((a, b) => this.totalOrder.compare(a.position, b.position))
                    .map((node) => node?.value || "ð")
                    .join("");
            } else {
                res += idx[0]?.value || "ð";
            }
        }

        return res.toString();
    }

    effect(msg: FugueMessage) {
        // On
        console.log({ msg });
        const { replicaId, operation, data, position } = msg;
        if (replicaId == this.totalOrder.getReplicaId()) return;

        switch (operation) {
            // Operation.INSERT -> insert
            case Operation.INSERT:
                if (!data) throw Error("Data is required for Operation.INSERT");
                return this.insert(position, data);
            // Operation.DELETE -> delete
            case Operation.DELETE:
                return this.delete(position);
        }
        throw Error("Invalid operation");
    }
}
