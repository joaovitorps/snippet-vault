import { vi } from "vitest";

vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-at-least-32-characters-long");
vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
vi.stubEnv("RESEND_API_KEY", "re_test_key");
vi.stubEnv("FROM_EMAIL", "test@example.com");
