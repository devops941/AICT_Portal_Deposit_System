"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecimalUtils = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
bignumber_js_1.default.config({
    DECIMAL_PLACES: 2,
    ROUNDING_MODE: bignumber_js_1.default.ROUND_HALF_UP,
    EXPONENTIAL_AT: [-1e9, 1e9],
});
class DecimalUtils {
    static from(value) {
        if (value === null || value === undefined || value === '') {
            return new bignumber_js_1.default(0);
        }
        if (typeof value === 'object' && 'toString' in value) {
            return new bignumber_js_1.default(value.toString());
        }
        return new bignumber_js_1.default(value);
    }
    static add(a, b) {
        return this.from(a).plus(this.from(b));
    }
    static subtract(a, b) {
        return this.from(a).minus(this.from(b));
    }
    static multiply(a, b) {
        return this.from(a).multipliedBy(this.from(b));
    }
    static isGreaterThanOrEqualTo(a, b) {
        return this.from(a).isGreaterThanOrEqualTo(this.from(b));
    }
    static isLessThan(a, b) {
        return this.from(a).isLessThan(this.from(b));
    }
    static isZero(a) {
        return this.from(a).isZero();
    }
    static max(...values) {
        if (values.length === 0)
            return new bignumber_js_1.default(0);
        return bignumber_js_1.default.max(...values.map((v) => this.from(v)));
    }
    static calculateShortfall(requiredAmount, eligibleDeposit) {
        const req = this.from(requiredAmount);
        const eligible = this.from(eligibleDeposit);
        const diff = req.minus(eligible);
        return bignumber_js_1.default.max(new bignumber_js_1.default(0), diff);
    }
    static formatCurrency(amount, currency = 'INR') {
        const bn = this.from(amount);
        const fixed = bn.toFixed(2);
        const [intPart, decPart] = fixed.split('.');
        const lastThree = intPart.substring(intPart.length - 3);
        const otherNumbers = intPart.substring(0, intPart.length - 3);
        const formattedInt = otherNumbers !== ''
            ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
            : lastThree;
        return `${currency === 'INR' ? '₹' : currency + ' '}${formattedInt}.${decPart}`;
    }
    static toFixedString(amount, decimals = 2) {
        return this.from(amount).toFixed(decimals);
    }
}
exports.DecimalUtils = DecimalUtils;
