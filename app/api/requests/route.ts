import { NextResponse } from "next/server";
import { getFieldErrors, requestSchema } from "@/lib/validation";
import { saveRequest } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Не удалось прочитать JSON запроса." }, { status: 400 });
  }
  const result = requestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({
      message: "Проверьте поля обращения. Допустимы только имя, телефон и вознаграждение.",
      errors: getFieldErrors(result.error),
    }, { status: 400 });
  }
  try {
    saveRequest(result.data);
    return NextResponse.json({ message: "Обращение сохранено. Галерея свяжется с вами по указанному телефону." }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Не удалось сохранить обращение. Попробуйте позже." }, { status: 500 });
  }
}
