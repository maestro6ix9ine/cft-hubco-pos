import { useState } from 'react';

export interface BaseFormData {
  customerPhone: string;
  customerName: string;
  paymentMode: string;
  additionalNotes: string;
}

export const useServiceForm = <T extends BaseFormData>(initialData: T) => {
  const [formData, setFormData] = useState<T>(initialData);

  const updateFormData = (updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updateField = <K extends keyof T>(field: K, value: T[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(initialData);
  };

  const isValid = () => {
    return !!(
      formData.customerPhone &&
      formData.customerName &&
      formData.paymentMode
    );
  };

  return {
    formData,
    setFormData,
    updateFormData,
    updateField,
    resetForm,
    isValid,
  };
};