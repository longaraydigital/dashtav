import { NextResponse } from "next/server"
import type { ApiResponse, ApiError } from "@/types"

export function ok<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data, success: true }, { status })
}

export function err(message: string, status = 400, details?: unknown): NextResponse<ApiError> {
  return NextResponse.json({ error: message, success: false, details }, { status })
}

export function notFound(resource = "Recurso"): NextResponse<ApiError> {
  return err(`${resource} não encontrado`, 404)
}

export function serverError(e: unknown): NextResponse<ApiError> {
  console.error("[API Error]", e)
  return err("Erro interno do servidor", 500)
}
