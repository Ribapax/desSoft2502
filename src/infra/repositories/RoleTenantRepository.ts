import { dbConnection } from '../database/connection';

export class RoleTenantRepository {
  public async setStatus(roleId: string, tenantId: string, status: boolean): Promise<void> {
    const flag = status === false ? false : true;
    await dbConnection.query(
      `INSERT INTO roles_tenants (role_id, tenant_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (role_id, tenant_id)
       DO UPDATE SET status = EXCLUDED.status`,
      [roleId, tenantId, flag]
    );
  }
}
