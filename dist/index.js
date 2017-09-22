"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var operatorFunctions = {
    '=': function (a, b) { return a === b; },
    '<': function (a, b) { return a < b; },
    '>': function (a, b) { return a > b; }
};
var Thresholder = /** @class */ (function (_super) {
    __extends(Thresholder, _super);
    function Thresholder(threshold, duration, clearAfter, boundary, operator) {
        if (threshold === void 0) { threshold = 1; }
        if (duration === void 0) { duration = 0; }
        if (clearAfter === void 0) { clearAfter = 0; }
        var _this = _super.call(this) || this;
        _this.bucket = []; // bucket to keep timestamp of past boundary hits within the duration
        _this.isBroken = false;
        _this.threshold = threshold;
        _this.duration = duration;
        _this.clearAfter = clearAfter;
        if (boundary) {
            _this.boundary = boundary;
            if (operator) {
                _this.operator = operator;
            }
            else {
                throw new Error('An operator (=, <, >) must be specified for how to check value against boundary');
            }
        }
        return _this;
    }
    Object.defineProperty(Thresholder.prototype, "length", {
        get: function () {
            return this.bucket.length;
        },
        enumerable: true,
        configurable: true
    });
    Thresholder.prototype.push = function (val, prop) {
        if (this.isBroken && this.clearAfter > 0) {
            return;
        }
        var violation = false;
        var value = (typeof (val) === 'object' && prop in val) ? val[prop] : val;
        this.removeExpiredItems();
        if (this.boundary && operatorFunctions[this.operator](value, this.boundary)) {
            violation = true;
        }
        if (violation || value === true) {
            this.bucket.push(Date.now());
            if (this.bucket.length >= this.threshold) {
                this.break(val);
            }
        }
        else if (this.clearAfter === 0) {
            this.clear();
        }
    };
    Thresholder.prototype.break = function (val) {
        this.isBroken = true;
        this.bucket.splice(0);
        if (this.clearAfter > 0) {
            var timer = global.setTimeout(this.clear.bind(this), this.clearAfter * 1000);
            if (timer.unref) {
                timer.unref();
            }
        }
        this.emit('break', val);
    };
    Thresholder.prototype.clear = function () {
        this.isBroken = false;
        this.emit('clear');
    };
    Thresholder.prototype.removeExpiredItems = function () {
        var len = this.bucket.length;
        if (len === 0) {
            return;
        }
        var now = Date.now();
        var start = now - this.duration * 1000;
        var i = 0;
        while (i < len && this.bucket[i] < start) {
            i++;
        }
        this.bucket.splice(0, i);
    };
    return Thresholder;
}(events_1.EventEmitter));
exports.Thresholder = Thresholder;
//# sourceMappingURL=index.js.map