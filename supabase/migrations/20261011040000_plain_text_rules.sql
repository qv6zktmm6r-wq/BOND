-- Profiles, Opportunity Board posts, and responses get the same text rules as events: no invisible
-- or direction-changing characters, no control characters (line breaks only in multi-line fields),
-- and no text made only of whitespace.

create or replace function private.text_is_plain(value text, multiline boolean)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value !~ '[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2069\u3164\uFEFF\uFFA0\uFFF9-\uFFFB\U000E0000-\U000E007F]'
    and value !~ case when multiline then '[\x01-\x09\x0B-\x1F\x7F\u0085\u2028\u2029]' else '[\x01-\x1F\x7F\u0085\u2028\u2029]' end
$$;

alter table public.company_profiles add constraint company_profiles_text_plain check (
  private.text_is_plain(
    concat_ws(' ', name, location, tagline, service_area, representative, website, public_phone,
      array_to_string(services || certifications || projects, ' ')),
    false
  )
  and private.text_is_plain(concat_ws(' ', description, story), true)
  and name ~ '[^[:space:]]' and description ~ '[^[:space:]]'
);

alter table public.opportunities add constraint opportunities_text_plain check (
  private.text_is_plain(concat_ws(' ', title, location, array_to_string(scope, ' ')), false)
  and private.text_is_plain(summary, true)
  and title ~ '[^[:space:]]' and summary ~ '[^[:space:]]'
);

alter table public.opportunity_responses add constraint opportunity_responses_text_plain check (
  private.text_is_plain(message, true) and private.text_is_plain(contact, false)
);
