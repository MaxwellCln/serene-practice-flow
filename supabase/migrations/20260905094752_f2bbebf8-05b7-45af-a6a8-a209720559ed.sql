CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.admin_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_invitations TO authenticated;
GRANT ALL ON public.admin_invitations TO service_role;

ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view invitations"
ON public.admin_invitations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create invitations"
ON public.admin_invitations FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE POLICY "Admins can update invitations"
ON public.admin_invitations FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER admin_invitations_set_updated_at
BEFORE UPDATE ON public.admin_invitations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX admin_invitations_email_idx ON public.admin_invitations (lower(email));

-- Accept an invitation: only for the signed-in user whose confirmed email matches.
CREATE OR REPLACE FUNCTION public.accept_admin_invite(_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  uid uuid := auth.uid();
  user_email text;
  user_confirmed timestamptz;
  inv public.admin_invitations%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RETURN 'not_signed_in';
  END IF;

  SELECT email, email_confirmed_at INTO user_email, user_confirmed
  FROM auth.users WHERE id = uid;

  SELECT * INTO inv FROM public.admin_invitations
  WHERE token_hash = encode(digest(_token, 'sha256'), 'hex');

  IF inv.id IS NULL THEN
    RETURN 'invalid';
  END IF;
  IF inv.revoked_at IS NOT NULL THEN
    RETURN 'revoked';
  END IF;
  IF inv.accepted_at IS NOT NULL THEN
    RETURN 'already_used';
  END IF;
  IF inv.expires_at <= now() THEN
    RETURN 'expired';
  END IF;
  IF user_confirmed IS NULL THEN
    RETURN 'email_unconfirmed';
  END IF;
  IF lower(user_email) IS DISTINCT FROM lower(inv.email) THEN
    RETURN 'email_mismatch';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
  ON CONFLICT DO NOTHING;

  UPDATE public.admin_invitations
  SET accepted_at = now(), accepted_by = uid
  WHERE id = inv.id;

  RETURN 'granted';
END;
$$;

REVOKE ALL ON FUNCTION public.accept_admin_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_admin_invite(text) TO authenticated;

-- Store a new invitation (admin only), returning the invitation id.
CREATE OR REPLACE FUNCTION public.create_admin_invite(_email text, _token text, _expires_at timestamptz)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  uid uuid := auth.uid();
  new_id uuid;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid, 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  INSERT INTO public.admin_invitations (email, token_hash, expires_at, created_by)
  VALUES (lower(trim(_email)), encode(digest(_token, 'sha256'), 'hex'), _expires_at, uid)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_admin_invite(text, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_admin_invite(text, text, timestamptz) TO authenticated;

-- First-admin bootstrap now requires a confirmed email address.
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  confirmed timestamptz;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT email_confirmed_at INTO confirmed FROM auth.users WHERE id = uid;
  IF confirmed IS NULL THEN
    RETURN false;
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
  ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;