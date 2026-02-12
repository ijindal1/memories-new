import { AuthProvider } from "@descope/react-sdk";

const DESCOPE_PROJECT_ID = "P33F6yAWe8pY24yO8RD4N4wGVEEv";

export function MemoriesAuthProvider({ children }) {
  return (
    <AuthProvider projectId={DESCOPE_PROJECT_ID}>
      {children}
    </AuthProvider>
  );
}
