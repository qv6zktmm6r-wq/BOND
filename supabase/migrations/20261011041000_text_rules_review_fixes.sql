-- Review fixes for the text rules: also reject C1 control characters and invisible musical
-- formatting characters, treat text made only of blank-looking characters (no-break and wide
-- spaces, the blank Braille pattern) as empty regardless of the database locale, and give events
-- and activity-feed updates the same rules as profiles and the Opportunity Board.

create or replace function private.text_is_plain(value text, multiline boolean)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value !~ '[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2069\u3164\uFEFF\uFFA0\uFFF9-\uFFFB\U0001D173-\U0001D17A\U000E0000-\U000E007F]'
    and value !~ case when multiline then '[\x01-\x09\x0B-\x1F\x7F-\x9F\u2028\u2029]' else '[\x01-\x1F\x7F-\x9F\u2028\u2029]' end
$$;

create function private.text_has_content(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value ~ '[^\x09-\x0D\x20\x85\xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u2800\u3000]'
$$;

alter table public.company_profiles drop constraint company_profiles_text_plain;
alter table public.company_profiles add constraint company_profiles_text_plain check (
  private.text_is_plain(
    concat_ws(' ', name, location, tagline, service_area, representative, website, public_phone,
      array_to_string(services || certifications || projects, ' ')),
    false
  )
  and private.text_is_plain(concat_ws(' ', description, story), true)
  and private.text_has_content(name) and private.text_has_content(description)
);

alter table public.opportunities drop constraint opportunities_text_plain;
alter table public.opportunities add constraint opportunities_text_plain check (
  private.text_is_plain(concat_ws(' ', title, location, array_to_string(scope, ' ')), false)
  and private.text_is_plain(summary, true)
  and private.text_has_content(title) and private.text_has_content(summary)
);

alter table public.company_events drop constraint company_events_text_visible;
alter table public.company_events drop constraint company_events_text_plain;
alter table public.company_events drop constraint company_events_text_not_blank;
alter table public.company_events add constraint company_events_text_plain check (
  private.text_is_plain(title || ' ' || location, false)
  and private.text_is_plain(description, true)
  and private.text_has_content(title) and private.text_has_content(description)
  and (format = 'online' or private.text_has_content(location))
);

alter table public.company_updates drop constraint company_updates_text_visible;
alter table public.company_updates add constraint company_updates_text_plain check (
  private.text_is_plain(text, true) and private.text_has_content(text)
);
