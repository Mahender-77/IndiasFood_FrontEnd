/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLOUDINARY_CLOUD_NAME: string;
}

interface Window {
  recaptchaVerifier: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
