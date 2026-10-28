import BigNumber from 'bignumber.js';

// Configure BigNumber for banking-grade financial precision
BigNumber.config({
  DECIMAL_PLACES: 2,
  ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
  EXPONENTIAL_AT: [-1e9, 1e9],
});

export type DecimalValue =
  | string
  | number
  | BigNumber
  | { toString(): string }
  | null
  | undefined;

export class DecimalUtils {
  static from(value: DecimalValue): BigNumber {
    if (value === null || value === undefined || value === '') {
      return new BigNumber(0);
    }
    // Handle Mongoose Decimal128 or other objects with .toString()
    if (typeof value === 'object' && 'toString' in value) {
      return new BigNumber(value.toString());
    }
    return new BigNumber(value as string | number);
  }

  static add(a: DecimalValue, b: DecimalValue): BigNumber {
    return this.from(a).plus(this.from(b));
  }

  static subtract(a: DecimalValue, b: DecimalValue): BigNumber {
    return this.from(a).minus(this.from(b));
  }

  static multiply(a: DecimalValue, b: DecimalValue): BigNumber {
    return this.from(a).multipliedBy(this.from(b));
  }

  static isGreaterThanOrEqualTo(a: DecimalValue, b: DecimalValue): boolean {
    return this.from(a).isGreaterThanOrEqualTo(this.from(b));
  }

  static isLessThan(a: DecimalValue, b: DecimalValue): boolean {
    return this.from(a).isLessThan(this.from(b));
  }

  static isZero(a: DecimalValue): boolean {
    return this.from(a).isZero();
  }

  static max(...values: DecimalValue[]): BigNumber {
    if (values.length === 0) return new BigNumber(0);
    return BigNumber.max(...values.map((v) => this.from(v)));
  }

  /**
   * Financial Shortfall Calculation:
   * Shortfall = max(0, Required Amount - Eligible Verified Deposit)
   */
  static calculateShortfall(requiredAmount: DecimalValue, eligibleDeposit: DecimalValue): BigNumber {
    const req = this.from(requiredAmount);
    const eligible = this.from(eligibleDeposit);
    const diff = req.minus(eligible);
    return BigNumber.max(new BigNumber(0), diff);
  }

  static formatCurrency(amount: DecimalValue, currency: string = 'INR'): string {
    const bn = this.from(amount);
    const fixed = bn.toFixed(2);
    // Format according to Indian Numbering System (Lakhs & Crores)
    const [intPart, decPart] = fixed.split('.');
    const lastThree = intPart.substring(intPart.length - 3);
    const otherNumbers = intPart.substring(0, intPart.length - 3);
    const formattedInt =
      otherNumbers !== ''
        ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
        : lastThree;

    return `${currency === 'INR' ? '₹' : currency + ' '}${formattedInt}.${decPart}`;
  }

  static toFixedString(amount: DecimalValue, decimals: number = 2): string {
    return this.from(amount).toFixed(decimals);
  }
}
