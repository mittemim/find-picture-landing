export type RequestValues = { contactPerson: string; phone: string; reward: string };
export type RequestErrors = Partial<Record<keyof RequestValues, string>>;

export function validateRequest(values: RequestValues): RequestErrors {
  const errors: RequestErrors = {};
  if (!values.contactPerson.trim()) errors.contactPerson = "Укажите, как к вам обращаться.";
  if (!values.phone.trim()) errors.phone = "Укажите телефон для связи.";
  else if (!/^\d+$/.test(values.phone.trim())) errors.phone = "Введите номер только цифрами, без пробелов и знаков.";
  if (!values.reward.trim()) errors.reward = "Укажите ожидаемую сумму. Можно указать 0.";
  else if (!/^\d+(?:[.,]\d+)?$/.test(values.reward.trim()) || !Number.isFinite(Number(values.reward.trim().replace(",", ".")))) {
    errors.reward = "Введите сумму цифрами, например 15000.";
  }
  return errors;
}
