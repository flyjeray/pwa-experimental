import type { SubmitEventHandler } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { useAuth } from "~/hooks/useAuth";

export const LoginForm = () => {
  const { login, register } = useAuth();

  const handleLogin: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    const email = (formData.get("email") ?? "") as string;
    const password = (formData.get("password") ?? "") as string;

    await login(email, password);
  };

  const handleRegister: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    const email = (formData.get("email") ?? "") as string;
    const password = (formData.get("password") ?? "") as string;

    await register(email, password);
  };

  const onSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    const submitter = event.nativeEvent.submitter as HTMLButtonElement;
    if (submitter.value === "signin") {
      return handleLogin(event);
    } else if (submitter.value === "signup") {
      return handleRegister(event);
    } else {
      console.warn("Unknown submitter:", submitter);
    }
  };

  return (
    <div className={"flex flex-col gap-6"}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                </div>
                <Input id="password" name="password" type="password" required />
              </Field>
              <Field>
                <Button type="submit" value="signin">
                  Login
                </Button>
                <Button type="submit" value="signup" variant="outline">
                  Register
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
