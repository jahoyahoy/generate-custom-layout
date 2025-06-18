// Types for SignIn component

export interface IdpHintRedirects {
  [domain: string]: string;
}

export interface SignInProps {
  domains?: string[];
  idpHintRedirects?: IdpHintRedirects;
  backgroundImageUrl?: string;
  logoUrl?: string;
  title?: string;
  subtitle?: string;
}

export interface AuthState {
  emailVerified: boolean;
  showNotification: boolean;
  notificationText: string;
  currentSubtitle: string;
  isLoading: boolean;
}

export interface EmailValidationError {
  message: string;
  field: string;
}

// Utility types for Azure B2C integration
export interface B2CFormElements {
  emailInput: HTMLInputElement | null;
  passwordInput: HTMLInputElement | null;
  submitButton: HTMLButtonElement | null;
  apiContainer: HTMLDivElement | null;
}

export interface URLSearchParams {
  get(name: string): string | null;
  set(name: string, value: string): void;
}

// Constants
export const DEFAULT_DOMAINS = ["@ahoyahoy.com", "@test.com"];

export const DEFAULT_IDP_REDIRECTS: IdpHintRedirects = {
  "@ahoyahoy.com": "whokta",
  "@test.com": "testIdP",
};

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
