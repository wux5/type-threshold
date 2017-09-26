"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const operatorFunctions = {
    '=': (a, b) => a === b,
    '<': (a, b) => a < b,
    '>': (a, b) => a > b
};
class Thresholder extends events_1.EventEmitter {
    constructor(threshold = 1, duration = 0, clearAfter = 0, boundary, operator) {
        super();
        this._violations = 0;
        this._clears = 0;
        this.bucket = []; // bucket to keep timestamp of past boundary hits within the duration
        this.isBroken = false;
        this.threshold = threshold;
        this.duration = duration;
        this.clearAfter = clearAfter;
        if (boundary) {
            this.boundary = boundary;
            if (operator) {
                this.operator = operator;
            }
            else {
                throw new Error('An operator (=, <, >) must be specified for how to check value against boundary');
            }
        }
    }
    get violations() {
        return this.duration > 0 ? this.bucket.length : this._violations;
    }
    push(val, prop) {
        if (this.isBroken && this.clearAfter > 0) {
            return;
        }
        let violation = false;
        let value = (typeof (val) === 'object' && prop in val) ? val[prop] : val;
        if (this.duration > 0) {
            this.removeExpiredItems();
        }
        if ((this.boundary !== undefined && operatorFunctions[this.operator](value, this.boundary)) || value === true) {
            if (this.duration > 0) {
                this.bucket.push(Date.now());
            }
            else {
                this._clears = 0;
                this._violations++;
            }
            if (this.violations >= this.threshold) {
                this.break(val);
            }
        }
        else if (this.isBroken && this.clearAfter === 0) {
            this._clears++;
            this._violations = 0;
            if (this._clears >= this.threshold) {
                this._clears = 0;
                this.clear();
            }
        }
        else if (this.duration === 0) {
            this._violations = 0;
        }
    }
    break(val) {
        this.isBroken = true;
        if (this.duration > 0) {
            this.bucket.splice(0);
            if (this.clearAfter > 0) {
                const timer = global.setTimeout(this.clear.bind(this), this.clearAfter * 1000);
                if (timer.unref) {
                    timer.unref();
                }
            }
        }
        else {
            this._violations = 0;
        }
        this.emit('break', val);
    }
    clear() {
        this.isBroken = false;
        this.emit('clear');
    }
    removeExpiredItems() {
        let len = this.bucket.length;
        if (len === 0) {
            return;
        }
        const now = Date.now();
        const start = now - this.duration * 1000;
        let i = 0;
        while (i < len && this.bucket[i] < start) {
            i++;
        }
        this.bucket.splice(0, i);
    }
}
exports.Thresholder = Thresholder;
//# sourceMappingURL=index.js.map