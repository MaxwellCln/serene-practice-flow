ALTER TABLE public.bookings ADD COLUMN precall_status text NOT NULL DEFAULT 'none';
ALTER TABLE public.bookings ADD CONSTRAINT bookings_precall_status_check CHECK (precall_status IN ('none','needs_contact','contacted','rejected','completed'));
CREATE INDEX bookings_precall_status_idx ON public.bookings (precall_status) WHERE precall_status <> 'none';