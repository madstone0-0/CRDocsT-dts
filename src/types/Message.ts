export enum Operation {
    INSERT,
    DELETE,
}

export type Position = number;

export type Data = string;

export interface FugueMessage {
    replicaId: string;
    operation: Operation;
    position: number;
    data: Data | null;
}
