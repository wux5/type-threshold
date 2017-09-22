/// <reference types="node" />
import { EventEmitter } from "events";
export declare type Operator = '=' | '<' | '>';
export declare class Thresholder extends EventEmitter {
    readonly threshold: number;
    readonly duration: number;
    readonly operator: Operator;
    readonly boundary: any;
    readonly bucket: any[];
    readonly clearAfter: number;
    isBroken: boolean;
    constructor(threshold?: number, duration?: number, clearAfter?: number, boundary?: any, operator?: Operator);
    readonly length: number;
    push(val: any, prop?: string): void;
    private break(val);
    private clear();
    private removeExpiredItems();
}
