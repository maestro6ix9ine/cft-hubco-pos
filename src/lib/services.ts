export const BARBING_SERVICES = [
  { value: 'adult_male_cut', label: 'Adult Male Cut', price: 1000 },
  { value: 'adult_female_cut', label: 'Adult Female Cut', price: 1000 },
  { value: 'children_cut', label: "Children's Cut", price: 500 },
  { value: 'toddler_cut', label: "Toddler's Cut", price: 500 },
] as const;

export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'pos', label: 'POS' },
  { value: 'cashback', label: 'Cashback' },
] as const;

export const DEVICE_TYPES = [
  'iPhone',
  'Android',
  'Power Bank',
  'Laptop',
  'Other'
] as const;

export const PRINT_SERVICES = {
  BW: { label: 'Black & White', pricePerPage: 50 },
  COLOR: { label: 'Color', pricePerPage: 100 }
} as const;

export const COPY_SERVICES = {
  BW_SINGLE: { label: 'B&W Single-sided', pricePerPage: 20 },
  BW_DOUBLE: { label: 'B&W Double-sided', pricePerPage: 30 },
  COLOR_SINGLE: { label: 'Color Single-sided', pricePerPage: 50 },
  COLOR_DOUBLE: { label: 'Color Double-sided', pricePerPage: 70 }
} as const;

export const SCAN_SERVICES = {
  STANDARD: { label: 'Standard Scan', pricePerPage: 30 }
} as const;

export const BINDING_SERVICES = {
  COMB: { label: 'Comb Binding', basePrice: 100 },
  WIRE: { label: 'Wire Binding', basePrice: 150 }
} as const;

export const LAMINATION_SERVICES = {
  A4: { label: 'A4 Lamination', price: 200 },
  A3: { label: 'A3 Lamination', price: 300 }
} as const;

export const CASHBACK_RATE = 0.05; // 5%

export const calculateCashback = (amount: number): number => {
  return Math.round(amount * CASHBACK_RATE);
};