import { EventEmitter } from "events";

export type Operator = '=' | '<' | '>';
const operatorFunctions = {
  '=': <T>(a: T, b: T): boolean => a === b,
  '<': <T>(a: T, b: T): boolean => a < b,
  '>': <T>(a: T, b: T): boolean => a > b
};

export class Thresholder extends EventEmitter {
  readonly threshold: number; // breaks at this number of hits
  readonly duration: number;  // check in past durations, in seconds
  readonly operator: Operator;  // operator for checking values against the boundary
  readonly boundary: any;  // hit boundary
  readonly bucket: any[] = []; // bucket to keep timestamp of past boundary hits within the duration
  readonly clearAfter: number; // Clear broken state, in seconds. When 0 it clears on next valid value
  isBroken: boolean = false;

  constructor(threshold: number = 1, duration: number = 0, clearAfter: number = 0, boundary?: any, operator?: Operator) {
    super();
    this.threshold = threshold;
    this.duration = duration;
    this.clearAfter = clearAfter;
    if (boundary) {
      this.boundary = boundary;
      if (operator) {
        this.operator = operator;
      } else {
        throw new Error('An operator (=, <, >) must be specified for how to check value against boundary');
      }
    }
  }

  get length(): number {
    return this.bucket.length;
  }

  push(val: any, prop?: string): void{
    if (this.isBroken && this.clearAfter > 0) {
      return;
    }
    let violation = false;
    let value = (typeof (val) === 'object' && prop in val) ? val[prop] : val;
    this.removeExpiredItems();
    if (this.boundary && operatorFunctions[this.operator](value, this.boundary)) {
      violation = true;
    }
    if (violation || value === true) {
      this.bucket.push(Date.now());
      if (this.bucket.length >= this.threshold) {
        this.break(val);
      }
    } else if (this.clearAfter === 0) {
      this.clear();
    }
  }

  private break(val: any): void {
    this.isBroken = true;
    this.bucket.splice(0);
    if (this.clearAfter > 0) {
      const timer = global.setTimeout(this.clear.bind(this), this.clearAfter * 1000);
      if (timer.unref) {
        timer.unref();
      }
    }
    this.emit('break', val);
  }
  private clear(): void {
    this.isBroken = false;
    this.emit('clear');
  }

  private removeExpiredItems(): void {
    let len = this.bucket.length;
    if (len === 0) {
      return;
    }
    const now: number = Date.now();
    const start: number = now - this.duration * 1000;
    let i = 0;
    while (i < len && this.bucket[i] < start) {
      i++;
    }
    this.bucket.splice(0, i);
  }

}
