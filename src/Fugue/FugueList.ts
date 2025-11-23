import { FNode } from "./FNode.js";
import { FugueState } from "../types/Fugue.js";
import { UniquelyDenseTotalOrder } from "../TotalOrder/UniquelyDenseTotalOrder.js";
import { FugueMessage, Operation } from "../types/Message.js";

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

    private propagate(msg: FugueMessage<P>) {
        if (!this.ws) return;

        this.ws.send(JSON.stringify(msg));
    }

    /**
     * Inserts a value at a given position
     * @param position - Position to insert at
     * @param value - Value to insert
     */
    private insertAtPosition(position: P, value: string) {
        let index = this.state.length;

        for (let i = 0; i < this.state.length; ++i) {
            const n = this.state[i][0];

            // Compare positions, if the value should be
            // ordered before this one, we found our index
            // this should fix the issue with inserting in the
            // middle messing up order
            if (this.totalOrder.compare(position, n.position) < 0) {
                index = i;
                break;
            }
        }

        console.log({ insertIndex: index });
        if (index >= this.state.length) {
            this.state.push([]);
        } else {
            this.state.splice(index, 0, []);
        }

        // Check if this position already exists at this index
        // If it does, we don't insert again
        const cell = this.state[index];
        const existing = cell.find((n) => this.totalOrder.compare(n.position, position) === 0);

        if (existing) return;

        cell.push(new FNode<P>(position, value));
    }

    /**
     * Generates unique position for new element at 'index'
     * @param index - Index to generate position for
     * @returns Generated position
     */
    private generatePosition(index: number): P {
        // If this is the first thing in the document
        if (this.state.length === 0) return this.totalOrder.createBetween();

        const prev = index > 0 ? this.findVisiblePosition(index - 1) : undefined;
        const next = this.findVisiblePosition(index);
        return this.totalOrder.createBetween(prev, next);
    }

    /**
     * Inserts new element with 'value' at 'index' in the list
     * @param index - Index to insert 'value' at
     * @param value - Value to insert
     */
    insert(index: number, value: string) {
        const pos = this.generatePosition(index);
        console.log({ index, pos });

        this.insertAtPosition(pos, value);

        this.propagate({
            replicaId: this.totalOrder.getReplicaId(),
            operation: Operation.INSERT,
            position: pos,
            data: value,
        });
    }

    /**
     *  Deletes value at given position
     * @param position - Position to delete at
     */
    private deleteAtPosition(position: P) {
        // Find the cell containing this position
        for (let i = 0; i < this.state.length; ++i) {
            const cell = this.state[i];
            const node = cell.find((n) => this.totalOrder.compare(n.position, position) === 0);

            if (node) {
                // Tombstone the node, TODO: Implement garbage collection
                node.value = undefined;
                return;
            }
        }
    }

    /**
     * Finds the position of the visible value at index
     * this ignores tombstoned values
     * @param index - Index of the visible value
     */
    findVisiblePosition(index: number): P | undefined {
        let count = 0;

        for (const cell of this.state) {
            for (const n of cell) {
                if (n.value !== undefined) {
                    if (count === index) return n.position;
                    count++;
                }
            }
        }
    }

    /**
     * Finds the visible index of the value at position
     * this ignores tombstoned values
     * @param position - Position to find visible index for
     * @returns
     */
    findVisibleIndex(position: P): number | undefined {
        let count = 0;

        for (const cell of this.state) {
            for (const n of cell) {
                if (n.value !== undefined) {
                    if (this.totalOrder.compare(n.position, position) === 0) return count;
                    count++;
                }
            }
        }

        return undefined;
    }

    /**
     * Delete value in the list at index
     * @param index - Index of the value to delete
     */
    delete(index: number) {
        const position = this.findVisiblePosition(index);
        console.log({ index, position });

        if (!position) {
            console.warn(`No element at position -> ${position}`);
            return;
        }

        this.deleteAtPosition(position);

        // Send to replicas
        this.propagate({
            replicaId: this.totalOrder.getReplicaId(),
            operation: Operation.DELETE,
            position: position,
            data: null,
        });
    }

    /**
     * Observes the current visible state of the list
     * @returns The current visible state of the list as a string
     */
    observe(): string {
        let res = new String();

        for (const idx of this.state) {
            // Filter out tombstoned nodes and sort by unique position
            const nodes = idx
                .filter((n) => n.value !== undefined)
                .sort((a, b) => this.totalOrder.compare(a.position, b.position));

            // Then append to resultdkjand if somehow
            //a value is undefined append the placeholder thorn
            for (const n of nodes) {
                res += n.value || "Þ";
            }
        }

        return res.toString();
    }

    effect(msg: FugueMessage<P>) {
        const { replicaId, operation, data, position } = msg;
        if (replicaId == this.totalOrder.getReplicaId()) return;

        switch (operation) {
            case Operation.INSERT:
                if (!data) throw Error("Data is required for Operation.INSERT");
                return this.insertAtPosition(position, data);
            case Operation.DELETE:
                return this.deleteAtPosition(position);
        }
        throw Error("Invalid operation");
    }

    replicaId(): string {
        return this.totalOrder.getReplicaId();
    }
}
