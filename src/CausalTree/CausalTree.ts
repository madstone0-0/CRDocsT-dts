import { CTNode } from "./CTNode.js";

export class CasualTree {
    /* 
    This is the fug crdt
    It is a tree
    It has a root 
    
    We can insert into the tree
    Delete from the tree
    Display the characters...
    Maybe add a build method from a list of operations...
    */
    root: CTNode;

    constructor(root: CTNode) {
        this.root = root;
    }
}
