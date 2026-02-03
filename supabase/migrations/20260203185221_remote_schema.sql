set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.enforce_items_immutable_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Disallow changing them later
    IF NEW.id         IS DISTINCT FROM OLD.id
       OR NEW.owner_id   IS DISTINCT FROM OLD.owner_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Cannot modify id, owner_id, or created_at';
    END IF;
  END IF;

  RETURN NEW;
END;$function$
;


