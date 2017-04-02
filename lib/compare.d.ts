export interface PatchObject {
    path: string[];
    op: "add" | "remove" | "replace";
    value?: any;
}
export declare function compare(tree1: any, tree2: any): PatchObject[];
