import { ItemsTable } from "./containers/itemsTable";
import { LoginForm } from "./containers/loginForm";
import { LogoutForm } from "./containers/logoutForm";
import { SystemState } from "./containers/systemState";
import { useSupabase } from "./supabase/hooks";

function App() {
  const { user } = useSupabase();

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      <SystemState />
      {user ? <LogoutForm /> : <LoginForm />}
      <ItemsTable />
    </div>
  );
}

export default App;
