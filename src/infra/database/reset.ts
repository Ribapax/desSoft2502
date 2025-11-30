import { dbConnection } from './connection';

export const resetDatabase = async () => {
  const statements = [
    'DELETE FROM user_roles;',
    'DELETE FROM user_tenants;',
    'DELETE FROM roles;',
    'DELETE FROM payments;',
    'DELETE FROM reservations;',
    'DELETE FROM spaces;',
    'DELETE FROM users;'
  ];

  await dbConnection.query('BEGIN;');
  for (const statement of statements) {
    await dbConnection.query(statement);
  }
  await dbConnection.query('COMMIT;');
};
