import { dbConnection } from '../database/connection';
import { Role } from '../../domain/entities/Role';

type AuthUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  roles: Role[];
};

export class AuthRepository {
  public async findByEmail(email: string): Promise<AuthUser | null> {
    const userResult = await dbConnection.query(
      'SELECT id, name, email, password FROM users WHERE email = $1',
      [email]
    );
    const userRow = userResult.rows[0];
    if (!userRow) return null;

    const rolesResult = await dbConnection.query(
      `SELECT r.id, r.name, r.description
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [userRow.id]
    );

    const roles: Role[] = rolesResult.rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      description: row.description ?? undefined
    }));

    return {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      password: userRow.password,
      roles
    };
  }
}
