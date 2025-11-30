import { AuthRepository } from '../../infra/repositories/AuthRepository';
import { AppError } from '../../domain/errors/AppError';

export class AuthService {
  private readonly repository = new AuthRepository();

  public async login(email: string, password: string) {
    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    if (user.password !== password) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    const { password: _pw, ...safeUser } = user;
    return { user: safeUser };
  }
}
