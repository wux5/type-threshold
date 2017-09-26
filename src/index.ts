import { EventEmitter } from "events";

export type Operator = '=' | '<' | '>';
const operatorFunctions = {
  '=': <T>(a: T, b: T): boolean => a === b,
  '<': <T>(a: T, b: T): boolean => a < b,
  '>': <T>(a: T, b: T): boolean => a > b
};

export class Thresholder<T> extends EventEmitter {
  private _violations: number = 0;
  private _clears: number = 0;

  readonly threshold: number; // breaks at this number of hits
  readonly duration: number;  // check in past durations, in seconds. Check consecutive times when 0.
  readonly operator: Operator;  // operator for checking values against the boundary
  readonly boundary: T;  // hit boundary
  readonly bucket: number[] = []; // bucket to keep timestamp of past boundary hits within the duration
  readonly clearAfter: number; // Clear broken state, in seconds. When 0 it clears on next valid value
  isBroken: boolean = false;

  constructor(threshold: number = 1, duration: number = 0, clearAfter: number = 0, boundary?: T, operator?: Operator) {
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

  get violations(): number {
    return this.duration > 0 ? this.bucket.length : this._violations;
  }

  push(val?: T | any, prop?: string): void {
    if (this.isBroken && this.clearAfter > 0) {
      return;
    }
    let violation = false;
    let value = (typeof (val) === 'object' && prop in val) ? val[prop] : val;
    if (this.duration > 0) {
      this.removeExpiredItems();
    }
    if ((this.boundary === undefined && val !== undefined) || (this.boundary !== undefined && operatorFunctions[this.operator](value, this.boundary))) {
      if (this.duration > 0) {
        this.bucket.push(Date.now());
      } else {
        this._clears = 0;
        this._violations++;
      }
      if (this.violations >= this.threshold) {
        this.break(val);
      }
    } else if (this.isBroken && this.clearAfter === 0) {
      this._clears++;
      this._violations = 0;
      if (this._clears >= this.threshold) {
        this._clears = 0;
        this.clear();
      }
    } else if (this.duration === 0) {
      this._violations = 0;
    }
  }

  private break(val: T): void {
    this.isBroken = true;
    if (this.duration > 0) {
      this.bucket.splice(0);
      if (this.clearAfter > 0) {
        const timer = global.setTimeout(this.clear.bind(this), this.clearAfter * 1000);
        if (timer.unref) {
          timer.unref();
        }
      }
    } else {
      this._violations = 0;
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
