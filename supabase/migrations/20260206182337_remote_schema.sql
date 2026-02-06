create extension if not exists "moddatetime" with schema "extensions";

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');


