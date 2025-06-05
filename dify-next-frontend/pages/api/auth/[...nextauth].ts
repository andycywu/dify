import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'jsmith' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Replace this with your own logic to validate credentials
        if (credentials?.username && credentials?.password) {
          return { id: credentials.username, name: credentials.username }
        }
        return null
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/login',
  },
})
