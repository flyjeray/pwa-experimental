-- Enable RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Only allow owners to read/update/delete their own rows
CREATE POLICY "items_select_own"
ON public.items
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "items_insert_own"
ON public.items
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "items_update_own"
ON public.items
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "items_delete_own"
ON public.items
FOR DELETE
USING (auth.uid() = owner_id);

-- Immutable columns: id, owner_id, created_at
CREATE OR REPLACE FUNCTION public.enforce_items_immutable_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Disallow explicitly setting these on insert
    IF NEW.id IS DISTINCT FROM DEFAULT
      OR NEW.created_at IS DISTINCT FROM DEFAULT THEN
      RAISE EXCEPTION 'Cannot set id or created_at explicitly on INSERT';
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Disallow changing them later
    IF NEW.id         IS DISTINCT FROM OLD.id
       OR NEW.owner_id   IS DISTINCT FROM OLD.owner_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Cannot modify id, owner_id, or created_at';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_items_immutable_columns ON public.items;

CREATE TRIGGER trg_items_immutable_columns
BEFORE INSERT OR UPDATE ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.enforce_items_immutable_columns();