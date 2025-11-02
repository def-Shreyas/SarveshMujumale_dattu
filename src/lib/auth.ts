export function validateCredentials(username: string, password: string) {
  return (
    username === import.meta.env.VITE_ADMIN_USERNAME &&
    password === import.meta.env.VITE_ADMIN_PASSWORD
  );
}