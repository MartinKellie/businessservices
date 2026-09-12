import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { getSettings } from '@/lib/services/settings';
import { normaliseSearchText } from '@/lib/text';

/**
 * Postgres-only search (scope §6). Query flow:
 *   1. normalise the query
 *   2. resolve it to product/service concepts and categories via their names and
 *      via approved scoped synonyms; collect approved global synonyms as extra
 *      name-search terms (application-level synonym expansion)
 *   3. score candidate businesses in one SQL statement (name > concept > category,
 *      exact > fuzzy), apply the area or "Cerca de mí" radius filter and the
 *      result filters, then rank (relevance, then distance; temporarily-closed
 *      demoted; draft/archived and non-name-matched permanently-closed/relocated
 *      excluded)
 *
 * Weights are deliberately simple and tunable.
 */
const WEIGHTS = {
  nameExact: 6,
  namePrefix: 4.5,
  nameFts: 3.5,
  nameTrigram: 3,
  concept: 2.5,
  category: 1.6,
  tempClosedMultiplier: 0.5,
};

// Weights are trusted constants; inline them as numeric literals so Postgres
// does not infer an integer type for the surrounding CASE expression.
const w = (n: number) => sql.raw(`${n}::float8`);

/** Minimum trigram similarity for a vocabulary term to count as a match. */
const VOCAB_MIN_SIMILARITY = 0.3;

// Postgres array literals as a single casted parameter — avoids driver-specific
// serialisation of empty JS arrays.
const uuidArray = (ids: string[]) => sql`${`{${ids.join(',')}}`}::uuid[]`;
const floatArray = (ns: number[]) => sql`${`{${ns.join(',')}}`}::float8[]`;
const textArray = (items: string[]) =>
  sql`${`{${items.map((t) => `"${t.replace(/(["\\])/g, '\\$1')}"`).join(',')}}`}::text[]`;

export const searchQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  areaId: z.string().uuid().optional(),
  lat: z.coerce.number().gte(-90).lte(90).optional(),
  lng: z.coerce.number().gte(-180).lte(180).optional(),
  categoryId: z.string().uuid().optional(),
  openNow: z.coerce.boolean().optional(),
  whatsapp: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export type SearchInput = z.infer<typeof searchQuerySchema>;

const PAGE_SIZE = 20;
const MAX_PINS = 200;

type VocabMatch = { id: string; strength: number };
export type ResolvedVocabulary = {
  conceptMatches: VocabMatch[];
  categoryMatches: VocabMatch[];
  globalTerms: string[];
};

/** Step 2: resolve a normalised query to concept/category ids + global expansions. */
export async function resolveVocabulary(qNorm: string): Promise<ResolvedVocabulary> {
  if (!qNorm) return { conceptMatches: [], categoryMatches: [], globalTerms: [] };

  const rows = await db.execute<{
    kind: string;
    id: string | null;
    term: string | null;
    strength: number;
  }>(sql`
    with q as (select ${qNorm}::text as term)
    -- concepts by name / full text
    select 'concept' as kind, ps.id, null::text as term,
      greatest(
        case when ps.name_normalised = q.term then 1.0
             when q.term like '%' || ps.name_normalised || '%' then 0.9
             else similarity(ps.name_normalised, q.term) end,
        case when ps.search_vector @@ websearch_to_tsquery('spanish', q.term) then 0.7 else 0 end
      ) as strength
    from products_services ps, q
    where ps.status = 'approved'
      and (ps.name_normalised % q.term
           or q.term like '%' || ps.name_normalised || '%'
           or ps.search_vector @@ websearch_to_tsquery('spanish', q.term))
    union all
    -- categories by name / full text
    select 'category' as kind, c.id, null::text,
      greatest(
        case when c.name_normalised = q.term then 1.0
             when q.term like '%' || c.name_normalised || '%' then 0.9
             else similarity(c.name_normalised, q.term) end,
        case when c.search_vector @@ websearch_to_tsquery('spanish', q.term) then 0.7 else 0 end
      )
    from categories c, q
    where c.status = 'approved'
      and (c.name_normalised % q.term
           or q.term like '%' || c.name_normalised || '%'
           or c.search_vector @@ websearch_to_tsquery('spanish', q.term))
    union all
    -- scoped synonyms -> their concept / category target
    select case when s.scope = 'product_service' then 'concept' else 'category' end,
      coalesce(s.product_service_id, s.category_id), null::text,
      case when s.term_normalised = q.term then 1.0
           when q.term like '%' || s.term_normalised || '%' then 0.9
           else similarity(s.term_normalised, q.term) end
    from synonyms s, q
    where s.status = 'approved' and s.scope in ('product_service', 'category')
      and (s.term_normalised % q.term or q.term like '%' || s.term_normalised || '%')
    union all
    -- approved global synonyms -> extra name-search terms
    select 'global' as kind, null::uuid, s.term,
      case when s.term_normalised = q.term then 1.0
           when q.term like '%' || s.term_normalised || '%' then 0.9
           else similarity(s.term_normalised, q.term) end
    from synonyms s, q
    where s.status = 'approved' and s.scope = 'global'
      and (s.term_normalised % q.term or q.term like '%' || s.term_normalised || '%')
  `);

  const concepts = new Map<string, number>();
  const categories = new Map<string, number>();
  const globals = new Set<string>();

  for (const row of rows.rows) {
    const strength = Number(row.strength);
    if (strength < VOCAB_MIN_SIMILARITY) continue;
    if (row.kind === 'concept' && row.id) {
      concepts.set(row.id, Math.max(concepts.get(row.id) ?? 0, strength));
    } else if (row.kind === 'category' && row.id) {
      categories.set(row.id, Math.max(categories.get(row.id) ?? 0, strength));
    } else if (row.kind === 'global' && row.term) {
      globals.add(row.term.toLowerCase());
    }
  }

  return {
    conceptMatches: [...concepts].map(([id, strength]) => ({ id, strength })),
    categoryMatches: [...categories].map(([id, strength]) => ({ id, strength })),
    globalTerms: [...globals],
  };
}

type SearchRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  premises_kind: string | null;
  service_area_note: string | null;
  area_name: string | null;
  lat: number | null;
  lng: number | null;
  distance_m: number | null;
  primary_category_name: string | null;
  primary_category_slug: string | null;
  primary_category_icon: string | null;
  other_categories: { name: string; slug: string }[] | null;
  logo_url: string | null;
  photo_url: string | null;
  has_hours: boolean;
  open_now: boolean;
  is_name_hit: boolean;
  adj_score: number;
  total_count: number;
};

export type SearchCard = {
  id: string;
  name: string;
  slug: string;
  status: string;
  primaryCategory: { name: string; slug: string; icon: string | null } | null;
  otherCategories: { name: string; slug: string }[];
  areaName: string | null;
  serviceAreaNote: string | null;
  logoUrl: string | null;
  photoUrl: string | null;
  openStatus: 'open' | 'closed' | null;
  distanceMeters: number | null;
  contact: {
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    website: string | null;
    instagram: string | null;
    facebook: string | null;
  };
};

export type SearchPin = {
  businessId: string;
  name: string;
  status: string;
  lat: number;
  lng: number;
};

export type SearchResult = {
  results: SearchCard[];
  pins: SearchPin[];
  total: number;
  page: number;
  pageSize: number;
  appliedAreaId: string | null;
  appliedRadiusMeters: number | null;
  resolved: { conceptIds: string[]; categoryIds: string[]; globalTerms: string[] };
};

function toCard(row: SearchRow): SearchCard {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    primaryCategory: row.primary_category_name
      ? {
          name: row.primary_category_name,
          slug: row.primary_category_slug ?? '',
          icon: row.primary_category_icon,
        }
      : null,
    otherCategories: row.other_categories ?? [],
    areaName: row.area_name,
    serviceAreaNote: row.premises_kind === 'service_area' ? row.service_area_note : null,
    logoUrl: row.logo_url,
    photoUrl: row.photo_url,
    openStatus: row.has_hours ? (row.open_now ? 'open' : 'closed') : null,
    distanceMeters: row.distance_m === null ? null : Math.round(Number(row.distance_m)),
    contact: {
      phone: row.phone,
      whatsapp: row.whatsapp,
      email: row.email,
      website: row.website,
      instagram: row.instagram,
      facebook: row.facebook,
    },
  };
}

async function runSearchRows(input: SearchInput): Promise<{
  rows: SearchRow[];
  resolved: { conceptIds: string[]; categoryIds: string[]; globalTerms: string[] };
  appliedRadiusMeters: number | null;
}> {
  const settings = await getSettings();
  const qNorm = input.q ? normaliseSearchText(input.q) : '';
  const hasQ = qNorm.length > 0;

  const vocab = await resolveVocabulary(qNorm);
  const conceptIds = vocab.conceptMatches.map((m) => m.id);
  const conceptStr = vocab.conceptMatches.map((m) => m.strength);
  const categoryIds = vocab.categoryMatches.map((m) => m.id);
  const categoryStr = vocab.categoryMatches.map((m) => m.strength);
  const nameTerms = hasQ ? [qNorm, ...vocab.globalTerms] : [];

  const useRadius = input.lat !== undefined && input.lng !== undefined;
  const point = useRadius
    ? sql`ST_SetSRID(ST_MakePoint(${input.lng}, ${input.lat}), 4326)::geography`
    : sql`NULL::geography`;
  const radius = settings.nearMeRadiusMeters;

  const rows = await db.execute<SearchRow>(sql`
    with
      now_bog as (select (now() at time zone 'America/Bogota') as ts),
      tz as (select extract(isodow from ts)::int as dow, ts::time as tod from now_bog),
      name_terms as (select unnest(${textArray(nameTerms)}) as term),
      name_hits as (
        select b.id as business_id, max(greatest(
          case when b.name_normalised = nt.term then ${w(WEIGHTS.nameExact)}
               when b.name_normalised like nt.term || '%' then ${w(WEIGHTS.namePrefix)}
               when b.name_normalised % nt.term then ${w(WEIGHTS.nameTrigram)} * similarity(b.name_normalised, nt.term)
               else 0 end,
          case when b.search_vector @@ websearch_to_tsquery('spanish', nt.term) then ${w(WEIGHTS.nameFts)} else 0 end
        )) as score
        from businesses b join name_terms nt
          on (b.name_normalised % nt.term
              or b.name_normalised like nt.term || '%'
              or b.search_vector @@ websearch_to_tsquery('spanish', nt.term))
        group by b.id
      ),
      concept_hits as (
        select bps.business_id, max(m.strength) * ${w(WEIGHTS.concept)} as score
        from unnest(${uuidArray(conceptIds)}, ${floatArray(conceptStr)}) as m(id, strength)
        join business_products_services bps on bps.product_service_id = m.id
        group by bps.business_id
      ),
      category_hits as (
        select bc.business_id, max(m.strength) * ${w(WEIGHTS.category)} as score
        from unnest(${uuidArray(categoryIds)}, ${floatArray(categoryStr)}) as m(id, strength)
        join business_categories bc on bc.category_id = m.id
        group by bc.business_id
      ),
      browse_hits as (
        select b.id as business_id, 0::float8 as score
        from businesses b
        where ${!hasQ}::boolean
      ),
      scored as (
        select business_id, sum(score) as score
        from (
          select * from name_hits
          union all select * from concept_hits
          union all select * from category_hits
          union all select * from browse_hits
        ) u
        group by business_id
      ),
      enriched as (
        select b.id, b.name, b.slug, b.status,
          b.phone, b.whatsapp, b.email, b.website, b.instagram, b.facebook,
          prem.kind as premises_kind, prem.service_area_note,
          ar.name as area_name, prem.area_id,
          ST_Y(prem.location::geometry) as lat, ST_X(prem.location::geometry) as lng,
          case when ${point} is not null
            then ST_Distance(coalesce(prem.location, ar.centroid), ${point}) end as distance_m,
          pc.name as primary_category_name, pc.slug as primary_category_slug,
          pc.fallback_icon as primary_category_icon,
          oc.other_categories,
          logo.blob_url as logo_url, photo.blob_url as photo_url,
          exists (
            select 1 from opening_hours oh, tz
            where oh.business_id = b.id and oh.premises_id is null and (
              (oh.day_of_week = tz.dow and oh.closes_at > oh.opens_at
                 and tz.tod >= oh.opens_at and tz.tod < oh.closes_at)
              or (oh.day_of_week = tz.dow and oh.closes_at <= oh.opens_at and tz.tod >= oh.opens_at)
              or (oh.day_of_week = (case when tz.dow = 1 then 7 else tz.dow - 1 end)
                 and oh.closes_at <= oh.opens_at and tz.tod < oh.closes_at)
            )
          ) as open_now,
          exists (
            select 1 from opening_hours oh2
            where oh2.business_id = b.id and oh2.premises_id is null
          ) as has_hours,
          s.score,
          exists (select 1 from name_hits nh where nh.business_id = b.id) as is_name_hit
        from scored s
        join businesses b on b.id = s.business_id
        left join lateral (
          select * from premises p where p.business_id = b.id and p.is_active limit 1
        ) prem on true
        left join areas ar on ar.id = prem.area_id
        left join lateral (
          select c.name, c.slug, c.fallback_icon
          from business_categories bc join categories c on c.id = bc.category_id
          where bc.business_id = b.id and bc.is_primary limit 1
        ) pc on true
        left join lateral (
          select coalesce(jsonb_agg(jsonb_build_object('name', c.name, 'slug', c.slug)), '[]'::jsonb) as other_categories
          from business_categories bc join categories c on c.id = bc.category_id
          where bc.business_id = b.id and bc.is_primary = false
        ) oc on true
        left join lateral (
          select blob_url from business_media
          where business_id = b.id and type = 'logo' and review_status = 'approved'
          order by sort_order limit 1
        ) logo on true
        left join lateral (
          select blob_url from business_media
          where business_id = b.id and type = 'photo' and review_status = 'approved'
          order by sort_order limit 1
        ) photo on true
        where b.status not in ('draft', 'archived')
          and (
            b.status in ('active', 'temporarily_closed')
            or exists (select 1 from name_hits nh where nh.business_id = b.id)
          )
          and (${input.categoryId ?? null}::uuid is null
               or exists (select 1 from business_categories bc
                          where bc.business_id = b.id and bc.category_id = ${input.categoryId ?? null}::uuid))
          and (${!input.whatsapp}::boolean or (b.whatsapp is not null and b.whatsapp <> ''))
          and (
            (${point} is not null and ST_DWithin(coalesce(prem.location, ar.centroid), ${point}, ${radius}))
            or (${point} is null and (${input.areaId ?? null}::uuid is null
                or prem.area_id = ${input.areaId ?? null}::uuid))
          )
      ),
      final as (
        select *, score * (case when status = 'temporarily_closed'
          then ${w(WEIGHTS.tempClosedMultiplier)} else 1 end) as adj_score
        from enriched
        where (${!input.openNow}::boolean or open_now)
      )
    select *, count(*) over () as total_count
    from final
    order by adj_score desc, distance_m asc nulls last, name asc
    limit ${MAX_PINS} offset 0
  `);

  return {
    rows: rows.rows,
    resolved: { conceptIds, categoryIds, globalTerms: vocab.globalTerms },
    appliedRadiusMeters: useRadius ? radius : null,
  };
}

export async function search(input: SearchInput): Promise<SearchResult> {
  const { rows, resolved, appliedRadiusMeters } = await runSearchRows(input);
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  const offset = (input.page - 1) * PAGE_SIZE;
  const pageRows = rows.slice(offset, offset + PAGE_SIZE);

  return {
    results: pageRows.map(toCard),
    pins: rows
      .filter((r) => r.lat !== null && r.lng !== null)
      .map((r) => ({
        businessId: r.id,
        name: r.name,
        status: r.status,
        lat: Number(r.lat),
        lng: Number(r.lng),
      })),
    total,
    page: input.page,
    pageSize: PAGE_SIZE,
    appliedAreaId: appliedRadiusMeters !== null ? null : (input.areaId ?? null),
    appliedRadiusMeters,
    resolved,
  };
}

/**
 * Admin search-preview (scope §32): does a given business appear for a term, at
 * what rank, and which query vocabulary matched?
 */
export async function searchPreview(businessId: string, q: string, areaId?: string) {
  const { rows, resolved } = await runSearchRows({ q, areaId, page: 1 });
  const index = rows.findIndex((r) => r.id === businessId);
  const row = index >= 0 ? rows[index] : null;

  return {
    appears: index >= 0,
    rank: index >= 0 ? index + 1 : null,
    total: rows.length > 0 ? Number(rows[0].total_count) : 0,
    matchedByName: row?.is_name_hit ?? false,
    score: row ? Number(row.adj_score) : null,
    resolved,
  };
}
