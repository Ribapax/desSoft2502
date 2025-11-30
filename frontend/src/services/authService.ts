type AuthResult = { email: string; roles: string[] };

export const authService = {
  async login(email: string, password: string): Promise<AuthResult> {
    const res = await fetch('http://localhost:3333/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      throw new Error('Credenciais inválidas');
    }

    const data = (await res.json()) as { user: { email: string; roles: { name: string }[] } };
    return {
      email: data.user.email,
      roles: data.user.roles.map((r) => r.name)
    };
  }
};
