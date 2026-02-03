import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  ItemTitle,
  Item,
  ItemDescription,
  ItemContent,
} from "~/components/ui/item";
import { useOnlineStatus } from "~/hooks/useOnlineStatus";
import { useSupabase } from "~/supabase/hooks";

export const SystemState = () => {
  const { wrapper, user } = useSupabase();
  const isOnline = useOnlineStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle>System State</CardTitle>
      </CardHeader>
      <CardContent className="flex w-full flex-col gap-2">
        <Item variant="outline">
          <ItemContent>
            <ItemTitle>Network Status</ItemTitle>
            <ItemDescription>{isOnline ? "Online" : "Offline"}</ItemDescription>
          </ItemContent>
        </Item>
        <Item variant="outline">
          <ItemContent>
            <ItemTitle>User</ItemTitle>
            <ItemDescription>
              {user ? user.email : "Not logged in"}
            </ItemDescription>
          </ItemContent>
        </Item>
        <Item variant="outline">
          <ItemContent>
            <ItemTitle>Supabase Initialized</ItemTitle>
            <ItemDescription>{wrapper ? "Yes" : "No"}</ItemDescription>
          </ItemContent>
        </Item>
      </CardContent>
    </Card>
  );
};
