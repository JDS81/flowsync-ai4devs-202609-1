/**
 * Espejo de `UserTransformer` del backend (app/transformers/user_transformer.ts).
 */
export type User = {
  id: number
  fullName: string | null
  email: string
  initials: string
  createdAt: string
  updatedAt: string
}

/**
 * Respuesta de `POST /auth/signup` y `POST /auth/login`, ya sin el envoltorio `{ data }`.
 */
export type AuthResult = {
  user: User
  token: string
}

export type SignupPayload = {
  /** El backend lo declara `.nullable()`: la clave debe viajar siempre, aunque valga `null`. */
  fullName: string | null
  email: string
  password: string
  passwordConfirmation: string
}

export type LoginPayload = {
  email: string
  password: string
}

/**
 * Conjunto cerrado de estados tal y como viajan por la API. En pantalla se
 * pintan con `TASK_STATUS_LABELS`, nunca con estos identificadores.
 */
export type TaskStatus = 'pending' | 'in_progress' | 'done'

/**
 * Espejo de `TaskTransformer` del backend. Del responsable solo llegan el id y
 * el nombre: el email no forma parte de la respuesta.
 */
export type Task = {
  id: number
  title: string
  status: TaskStatus
  assignee: { id: number; fullName: string | null }
  createdAt: string
  updatedAt: string
}
