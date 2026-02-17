import { getToken } from 'next-auth/jwt'
import { cookies, headers } from 'next/headers'

/**
 * Get session for API route handlers without CSRF validation.
 * Use this instead of auth() in API routes that accept POST/PUT/DELETE.
 * auth() performs CSRF checks on mutation requests which causes 403 errors.
 */
export async function getApiSession() {
  const cookieStore = await cookies()
  const headerStore = await headers()

  const token = await getToken({
    req: {
      cookies: Object.fromEntries(
        cookieStore.getAll().map((c) => [c.name, c.value])
      ),
      headers: Object.fromEntries(headerStore.entries()),
    } as Parameters<typeof getToken>[0]['req'],
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) return null

  return {
    user: {
      id: token.id as string,
      name: token.name as string,
      email: token.email as string,
      role: token.role as string,
      image: token.picture as string | undefined,
    },
  }
}
