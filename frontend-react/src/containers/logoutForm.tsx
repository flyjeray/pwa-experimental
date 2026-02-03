import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Field, FieldGroup } from "~/components/ui/field";
import { useAuth } from "~/hooks/useAuth";

export const LogoutForm = () => {
  const { logout } = useAuth();

  return (
    <div className={"flex flex-col gap-6"}>
      <Card>
        <CardHeader>
          <CardTitle>Logout from your account</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <Button type="button" onClick={logout}>
                Logout
              </Button>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
};
