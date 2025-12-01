import { defineStore } from 'pinia';

type AuthDraft = {
  id?: string;
  email: string;
  password: string;
  remember: boolean;
  lastSavedAt?: string;
  tenantIds: string[];
};

export const useAuthStore = defineStore('auth', {
  state: (): AuthDraft => ({
    id: undefined,
    email: '',
    password: '',
    remember: false,
    lastSavedAt: undefined,
    roles: [],
    tenantIds: []
  }),
  actions: {
    saveDraft(payload: Omit<AuthDraft, 'lastSavedAt'>) {
      this.id = payload.id;
      this.email = payload.email;
      this.password = payload.password;
      this.remember = payload.remember;
      this.lastSavedAt = new Date().toISOString();
      this.roles = payload.roles;
      this.tenantIds = payload.tenantIds;
    },
    authenticate(payload: { id?: string; email: string; roles: string[]; tenantIds?: string[] }) {
      this.id = payload.id;
      this.email = payload.email;
      this.roles = payload.roles;
      this.tenantIds = payload.tenantIds ?? [];
    }
  }
});
