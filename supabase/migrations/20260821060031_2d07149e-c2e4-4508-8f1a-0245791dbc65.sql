ALTER TABLE public.supplier_excel_templates
  ADD COLUMN IF NOT EXISTS sheet_name TEXT,
  ALTER COLUMN header_row DROP NOT NULL;