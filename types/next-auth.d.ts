import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      phone?: string | null
      displayName?: string
      username?: string
      avatarType?: string
      avatarData?: any
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    phone?: string | null
    displayName?: string
    username?: string
    avatarType?: string
    avatarData?: any
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
  }
}
