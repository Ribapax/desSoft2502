import { defineStore } from 'pinia';

type AuthDraft = {
  email: string;
  password: string;
  remember: boolean;
  lastSavedAt?: string;
};

export const useAuthStore = defineStore('auth', {
  state: (): AuthDraft => ({
    email: '',
    password: '',
    remember: false,
    lastSavedAt: undefined,
    roles: []
  }),
  actions: {
    saveDraft(payload: Omit<AuthDraft, 'lastSavedAt'>) {
      this.email = payload.email;
      this.password = payload.password;
      this.remember = payload.remember;
      this.lastSavedAt = new Date().toISOString();
      this.roles = payload.roles;
    },
    authenticate(payload: { email: string; roles: string[] }) {
      this.email = payload.email;
      this.roles = payload.roles;
    }
  }
});
