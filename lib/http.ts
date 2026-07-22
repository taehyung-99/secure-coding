import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function created<T>(data: T) {
  return ok(data, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.statusCode },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: "입력값을 확인해 주세요.",
        issues: error.flatten(),
      },
      { status: 400 },
    );
  }

  console.error(error);

  return NextResponse.json(
    { message: "요청을 처리하는 중 문제가 발생했습니다." },
    { status: 500 },
  );
}

export async function handleApi(operation: () => Promise<Response>) {
  try {
    return await operation();
  } catch (error) {
    return errorResponse(error);
  }
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new AppError("요청 본문이 올바른 JSON 형식이 아닙니다.", 400);
  }
}
