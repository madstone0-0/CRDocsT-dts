import { FugueState } from "./Fugue.js";

export enum Operation {
    INSERT,
    DELETE,
    JOIN,
}

export type Data = string;

export interface FugueMessage<P> {
    replicaId: string;
    operation: Operation;
    position: P;
    data: Data | null;
}

export interface FugueJoinMessage<P> {
    state: FugueState<P>;
}
