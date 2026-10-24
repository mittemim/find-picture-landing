"use client";

import { useRef, useState, type FormEvent } from "react";
import { validateRequest, type RequestValues, type RequestErrors } from "@/lib/validation";

const initialValues: RequestValues = { contactPerson: "", phone: "", reward: "" };

export default function RequestForm() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<RequestErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState("");
  const sendingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  function update(field: keyof RequestValues, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    setSubmitted(false);
    setServerError("");
    if (errors[field]) setErrors({ ...errors, [field]: validateRequest(next)[field] });
  }

  function focusField(field: keyof RequestValues) {
    formRef.current?.querySelector<HTMLInputElement>(`[name="${field}"]`)?.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendingRef.current) return;
    setSubmitted(false);
    setServerError("");
    const nextErrors = validateRequest(values);
    setErrors(nextErrors);
    const firstInvalid = (Object.keys(nextErrors) as (keyof RequestValues)[])[0];
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }
    sendingRef.current = true;
    setSending(true);
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) {
        const fieldErrors: RequestErrors = result.errors || {};
        setErrors(fieldErrors);
        setServerError(result.message || "Не удалось отправить обращение. Попробуйте позже.");
        const firstField = (Object.keys(fieldErrors) as (keyof RequestValues)[])[0];
        if (firstField) focusField(firstField);
        return;
      }
      setValues(initialValues);
      setSubmitted(true);
    } catch {
      setServerError("Не удалось получить подтверждение сохранения. Проверьте соединение и попробуйте позже.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  const fields = [
    { name: "contactPerson", label: "Контактное лицо", placeholder: "Как к вам обращаться", autoComplete: "name", hint: "2–20 символов: буквы, пробелы и тире." },
    { name: "phone", label: "Телефон для связи", placeholder: "79991234567", autoComplete: "tel", hint: "11 цифр, начиная с 7 или 8. Без знака + и пробелов." },
    { name: "reward", label: "Вознаграждение за наводку", placeholder: "Например, 15000", autoComplete: "off", hint: "До 7 символов, в рублях. 0 — без вознаграждения." },
  ] as const;

  return (
    <form ref={formRef} onSubmit={submit} noValidate aria-busy={sending}>
      <div className="fields">
        {fields.map((field) => (
          <div className="field" key={field.name}>
            <label htmlFor={field.name}>{field.label}{field.name === "reward" && <span className="currency">₽</span>}</label>
            <input id={field.name} name={field.name} type={field.name === "phone" ? "tel" : "text"}
              inputMode={field.name === "phone" ? "numeric" : field.name === "reward" ? "decimal" : "text"}
              autoComplete={field.autoComplete} placeholder={field.placeholder} value={values[field.name]}
              onChange={(event) => update(field.name, event.target.value)} required readOnly={sending}
              aria-invalid={Boolean(errors[field.name])} aria-describedby={`${field.name}-hint${errors[field.name] ? ` ${field.name}-error` : ""}`} />
            <p id={`${field.name}-hint`} className="field-hint">{field.hint}</p>
            {errors[field.name] && <p id={`${field.name}-error`} className="field-error" role="alert">{errors[field.name]}</p>}
          </div>
        ))}
      </div>
      <button type="submit" disabled={sending}>{sending ? "Сохраняем обращение…" : "Отправить запрос"} <span aria-hidden="true">↗</span></button>
      <div className="form-status" role="status" aria-live="polite">
        {serverError ? <p className="field-error">{serverError}</p>
          : submitted ? <p className="success">Обращение сохранено. Галерея свяжется с вами по указанному телефону.</p>
          : <p>Контакты нужны только для разговора с галереей.<br />Все три поля обязательны.</p>}
      </div>
    </form>
  );
}
