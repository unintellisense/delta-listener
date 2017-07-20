export declare type Operation = "add" | "remove" | "replace" | "*";
export interface PatchObject {
    path: string[];
    operation: Operation;
    value?: any;
}
export declare function compare(tree1: any, tree2: any): any[];
