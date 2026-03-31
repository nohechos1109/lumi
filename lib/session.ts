import { SessionOptions } from 'iron-session'

export interface SessionData {
  userId: string
  role: 'sales' | 'manager' | 'admin'
  username: string
}

export const sessionOptions: SessionOptions = {
  cookieName: process.env.SESSION_COOKIE_NAME ?? 'cotizador_session',
  password: process.env.SESSION_SECRET as string,
  cookieOptions: {
    secure: process.env.HTTPS === 'true',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
  },
}

