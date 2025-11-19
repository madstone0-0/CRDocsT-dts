export enum Operation {
    INSERT,
    DELETE,
}


export type Data = string;

export interface FugueMessage<P> {
    replicaId: string;
    operation: Operation;
    position: P;
    data: Data | null;
}
