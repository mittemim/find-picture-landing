import { z } from "zod";

export const rewardLimitMessage = "Вознаграждение больше 7 символов можно обсудить после личного общения и передачи сведений, в зависимости от их ценности.";

export const requestSchema = z.object({
  contactPerson: z.string({ error: "Укажите контактное лицо." })
    .trim()
    .min(2, "Имя должно содержать от 2 до 20 символов.")
    .max(20, "Имя должно содержать от 2 до 20 символов.")
    .regex(/^[\p{L} \-–—]+$/u, "В имени допустимы только буквы, пробелы и тире.")
    .refine((name) => /\p{L}/u.test(name), "Имя должно содержать буквы."),
  phone: z.string({ error: "Укажите телефон для связи." })
    .regex(/^[78]\d{10}$/, "Введите 11 цифр, начиная с 7 или 8, без пробелов и других символов."),
  reward: z.string({ error: "Укажите ожидаемое вознаграждение." })
    .min(1, "Укажите ожидаемую сумму. Можно указать 0.")
    .max(7, rewardLimitMessage)
    .regex(/^\d+(?:[.,]\d+)?$/, "Введите неотрицательную сумму цифрами, например 15000.")
    .transform((value) => Number(value.replace(",", "."))),
}).strict();

export type RequestValues = z.input<typeof requestSchema>;
export type ValidRequest = z.output<typeof requestSchema>;
export type RequestErrors = Partial<Record<keyof RequestValues, string>>;

export function getFieldErrors(error: z.ZodError): RequestErrors {
  const errors: RequestErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (field === "contactPerson" || field === "phone" || field === "reward") {
      errors[field] ??= issue.message;
    }
  }
  return errors;
}

export function validateRequest(values: RequestValues): RequestErrors {
  const result = requestSchema.safeParse(values);
  return result.success ? {} : getFieldErrors(result.error);
}
