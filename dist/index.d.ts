/// <reference types="node" />
import { EventEmitter } from "events";
export declare type Operator = '=' | '<' | '>';
export declare class Thresholder<T> extends EventEmitter {
    private _violations;
    private _clears;
    readonly threshold: number;
    readonly duration: number;
    readonly operator: Operator;
    readonly boundary: T;
    readonly bucket: number[];
    readonly clearAfter: number;
    isBroken: boolean;
    constructor(threshold?: number, duration?: number, clearAfter?: number, boundary?: T, operator?: Operator);
    readonly violations: number;
    push(val?: T | any, prop?: string): void;
    private break(val);
    private clear();
    private removeExpiredItems();
}
