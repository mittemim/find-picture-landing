"use client";

import { useRef, useState, type FormEvent } from "react";
import { validateRequest, type RequestValues, type RequestErrors } from "@/lib/validation";

const initialValues: RequestValues = { contactPerson: "", phone: "", reward: "" };

export default function RequestForm() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<RequestErrors>({});
  const [checked, setChecked] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function update(field: keyof RequestValues, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    setChecked(false);
    if (errors[field]) setErrors({ ...errors, [field]: validateRequest(next)[field] });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateRequest(values);
    setErrors(nextErrors);
    const firstInvalid = (Object.keys(nextErrors) as (keyof RequestValues)[])[0];
    setChecked(!firstInvalid);
    if (firstInvalid) formRef.current?.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)?.focus();
  }

  const fields = [
    { name: "contactPerson", label: "Контактное лицо", placeholder: "Как к вам обращаться", autoComplete: "name", hint: "Достаточно имени или удобного обращения." },
    { name: "phone", label: "Телефон для связи", placeholder: "79991234567", autoComplete: "tel", hint: "Только цифры, начиная с кода страны." },
    { name: "reward", label: "Вознаграждение за наводку", placeholder: "Например, 15000", autoComplete: "off", hint: "Сумма в рублях. 0 — без вознаграждения." },
  ] as const;

  return (
    <form ref={formRef} onSubmit={submit} noValidate>
      <div className="fields">
        {fields.map((field) => (
          <div className="field" key={field.name}>
            <label htmlFor={field.name}>{field.label}{field.name === "reward" && <span className="currency">₽</span>}</label>
            <input id={field.name} name={field.name} type={field.name === "phone" ? "tel" : "text"}
              inputMode={field.name === "phone" ? "numeric" : field.name === "reward" ? "decimal" : "text"}
              autoComplete={field.autoComplete} placeholder={field.placeholder} value={values[field.name]}
              onChange={(event) => update(field.name, event.target.value)} required
              aria-invalid={Boolean(errors[field.name])} aria-describedby={`${field.name}-hint${errors[field.name] ? ` ${field.name}-error` : ""}`} />
            <p id={`${field.name}-hint`} className="field-hint">{field.hint}</p>
            {errors[field.name] && <p id={`${field.name}-error`} className="field-error" role="alert">{errors[field.name]}</p>}
          </div>
        ))}
      </div>
      <button type="submit">Проверить запрос <span aria-hidden="true">↗</span></button>
      <div className="form-status" role="status" aria-live="polite">
        {checked ? <p className="success">Все поля заполнены корректно. Данные не отправлены: приём обращений пока не подключён.</p>
          : <p>Сейчас доступна проверка заполнения.<br />Данные остаются только на этой странице.</p>}
      </div>
    </form>
  );
}
