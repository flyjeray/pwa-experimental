import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

type Props = {
  message?: string;
};

export const OfflineCard = ({ message }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle>It appears that you are offline</CardTitle>
      {message && <CardDescription>{message}</CardDescription>}
    </CardHeader>
  </Card>
);
