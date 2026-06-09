import { useAuth } from "@web/auth/session";
import { Alert, AlertDescription, AlertTitle } from "@web/components/ui/alert";
import { Button } from "@web/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@web/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@web/components/ui/field";
import { Input } from "@web/components/ui/input";
import { authClient } from "@web/lib/auth-client";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";

export function SignInPage() {
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSentMagicLink, setHasSentMagicLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/snippets" />;
  }

  async function sendMagicLink(form: HTMLFormElement) {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData(form);
      const submittedEmail = String(formData.get("email") ?? "");

      await authClient.signIn.magicLink({
        email: submittedEmail,
        callbackURL: import.meta.env.DEV
          ? "http://localhost:5173/snippets"
          : "/snippets",
      });

      setHasSentMagicLink(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to send magic link",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto mt-24 max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Enter your email to receive a magic link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMagicLink(event.currentTarget);
            }}
          >
            <FieldGroup>
              <Field data-invalid={Boolean(error)}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(error)}
                  required
                />
                <FieldDescription>
                  We will send a one-time sign-in link to this address.
                </FieldDescription>
              </Field>
            </FieldGroup>

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Sign-in failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {hasSentMagicLink ? (
              <Alert>
                <AlertTitle>Check your email</AlertTitle>
                <AlertDescription>
                  Open the magic link we sent to finish signing in.
                </AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send magic link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/signin")({
  component: SignInPage,
});
