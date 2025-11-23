import { dbConnection } from './connection';

export const resetDatabase = () => {
  const statements = [
    'DELETE FROM payments;',
    'DELETE FROM reservations;',
    'DELETE FROM spaces;',
    'DELETE FROM users;'
  ];

  dbConnection.exec('BEGIN;');
  for (const statement of statements) {
    dbConnection.exec(statement);
  }
  dbConnection.exec('COMMIT;');
};
