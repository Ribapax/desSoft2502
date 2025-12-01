type AuthResult = { id: string; email: string; roles: string[]; tenantIds: string[] };

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

    const data = (await res.json()) as {
      user: { id: string; email: string; roles: { name: string }[]; tenantIds?: string[] };
    };
    return {
      id: data.user.id,
      email: data.user.email,
      roles: data.user.roles.map((r) => r.name),
      tenantIds: data.user.tenantIds ?? []
    };
  }
};
