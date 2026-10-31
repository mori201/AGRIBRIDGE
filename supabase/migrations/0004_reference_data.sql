-- =====================================================================
-- AgriBridge — Données de référence (non démo)
-- =====================================================================
insert into public.opportunity_categories (slug, name, icon) values
  ('subvention','Subvention agricole','hand-coins'),
  ('appel-a-projets','Appel à projets','megaphone'),
  ('concours','Concours entrepreneurial','trophy'),
  ('financement-bancaire','Financement bancaire','landmark'),
  ('microcredit','Microcrédit agricole','piggy-bank'),
  ('incubation','Bourse / programme d''incubation','rocket'),
  ('accompagnement','Programme d''accompagnement','handshake'),
  ('formation-financee','Formation financée','graduation-cap'),
  ('investissement','Investissement agricole','trending-up')
on conflict (slug) do nothing;

insert into public.product_categories (slug, name, icon) values
  ('cereales','Céréales','wheat'),
  ('fruits-legumes','Fruits et légumes','carrot'),
  ('produits-transformes','Produits transformés','package'),
  ('semences','Semences','sprout'),
  ('engrais','Engrais','flask-conical'),
  ('materiel-agricole','Matériel agricole','tractor'),
  ('irrigation','Équipements d''irrigation','droplets'),
  ('elevage','Produits d''élevage','beef')
on conflict (slug) do nothing;

insert into public.platform_settings (key, value) values
  ('limits', '{"ai_hourly_limit": 30}'),
  ('general', '{"maintenance": false, "announcement": "", "contact_email": "contact@agribridge.sn", "whatsapp": ""}')
on conflict (key) do nothing;
