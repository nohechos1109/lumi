import { SessionOptions } from 'iron-session'

export interface SessionData {
  userId: string
  role: 'sales' | 'manager' | 'admin' | 'almacen' | 'soporte'
  username: string
}

export const sessionOptions: SessionOptions = {
  cookieName: process.env.SESSION_COOKIE_NAME ?? 'cotizador_session',
  password: process.env.SESSION_SECRET as string,
  cookieOptions: {
    sameSite: 'lax',
    secure: process.env.APP_ENV =='production',
    path: '/',
    httpOnly: true,
    maxAge: 60 * 60 * 8, // 8 hours
  },
}

