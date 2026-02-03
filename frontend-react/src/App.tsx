import { ItemsTable } from "./containers/itemsTable";
import { LoginForm } from "./containers/loginForm";
import { LogoutForm } from "./containers/logoutForm";
import { OfflineCard } from "./containers/offlineCard";
import { SystemState } from "./containers/systemState";
import { useSupabase } from "./supabase/hooks";

function App() {
  const { user } = useSupabase();

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      <SystemState />
      {!navigator.onLine ? (
        <OfflineCard message="Connect to network to manage your account" />
      ) : user ? (
        <LogoutForm />
      ) : (
        <LoginForm />
      )}
      <ItemsTable />
    </div>
  );
}

export default App;
