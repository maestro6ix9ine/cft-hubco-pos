export const formatNaira = (amount: number): string => {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const parseNairaAmount = (value: string): number => {
  return parseFloat(value.replace(/[^\d.]/g, '')) || 0;
};