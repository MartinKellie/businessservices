import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  areas,
  businessCategories,
  businessMedia,
  businesses,
  categories,
  openingHours,
  premises,
} from '@/db/schema';
import { HttpError } from '@/lib/http';
import { getPublicSettings } from '@/lib/services/settings';

/** Active areas/communities for the selector (scope §5, §10). */
export async function listActiveAreas() {
  const rows = await db.execute<{
    id: string;
    name: string;
    slug: string;
    lat: number | null;
    lng: number | null;
  }>(sql`
    select id, name, slug,
      ST_Y(centroid::geometry) as lat, ST_X(centroid::geometry) as lng
    from areas
    where is_active = true
    order by sort_order, name
  `);
  return rows.rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    lat: r.lat === null ? null : Number(r.lat),
    lng: r.lng === null ? null : Number(r.lng),
  }));
}

/** Approved categories with a count of discoverable businesses (scope §5, §8). */
export async function listPublicCategories(opts: { popularOnly?: boolean } = {}) {
  const rows = await db.execute<{
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    is_popular: boolean;
    business_count: number;
  }>(sql`
    select c.id, c.name, c.slug, c.fallback_icon as icon, c.is_popular,
      count(b.id) filter (where b.status in ('active', 'temporarily_closed')) as business_count
    from categories c
    left join business_categories bc on bc.category_id = c.id
    left join businesses b on b.id = bc.business_id
    where c.status = 'approved'
      ${opts.popularOnly ? sql`and c.is_popular = true` : sql``}
    group by c.id
    order by c.sort_order, c.name
  `);
  return rows.rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    icon: r.icon,
    isPopular: r.is_popular,
    businessCount: Number(r.business_count),
  }));
}

const DAY_ORDER = sql`day_of_week, opens_at`;

/**
 * Public business detail (scope §6, §12, §13). Accepts a uuid or a slug. Reveals
 * the address / precise location and full opening hours — everything the card
 * withholds. "Última actualización" is included only when the setting allows it.
 * Draft and archived businesses are 404; permanently-closed and relocated remain
 * viewable by direct link.
 */
export async function getPublicBusiness(idOrSlug: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const business = await db.query.businesses.findFirst({
    where: isUuid ? eq(businesses.id, idOrSlug) : eq(businesses.slug, idOrSlug),
  });
  if (!business || business.status === 'draft' || business.status === 'archived') {
    throw new HttpError(404, 'not_found', 'Negocio no encontrado.');
  }

  const { showLastUpdated } = await getPublicSettings();

  const [cats, activePremises, hours, logo, photos, relocatedTo] = await Promise.all([
    db
      .select({
        name: categories.name,
        slug: categories.slug,
        icon: categories.fallbackIcon,
        isPrimary: businessCategories.isPrimary,
      })
      .from(businessCategories)
      .innerJoin(categories, eq(categories.id, businessCategories.categoryId))
      .where(eq(businessCategories.businessId, business.id)),
    db.execute<{
      kind: string;
      address_line: string | null;
      service_area_note: string | null;
      area_name: string | null;
      area_slug: string | null;
      lat: number | null;
      lng: number | null;
    }>(sql`
      select p.kind, p.address_line, p.service_area_note,
        a.name as area_name, a.slug as area_slug,
        ST_Y(p.location::geometry) as lat, ST_X(p.location::geometry) as lng
      from premises p left join areas a on a.id = p.area_id
      where p.business_id = ${business.id} and p.is_active
      limit 1
    `),
    db
      .select({
        dayOfWeek: openingHours.dayOfWeek,
        opensAt: openingHours.opensAt,
        closesAt: openingHours.closesAt,
      })
      .from(openingHours)
      .where(and(eq(openingHours.businessId, business.id), sql`${openingHours.premisesId} is null`))
      .orderBy(DAY_ORDER),
    db
      .select({ url: businessMedia.blobUrl })
      .from(businessMedia)
      .where(
        and(
          eq(businessMedia.businessId, business.id),
          eq(businessMedia.type, 'logo'),
          eq(businessMedia.reviewStatus, 'approved'),
        ),
      )
      .orderBy(asc(businessMedia.sortOrder))
      .limit(1),
    db
      .select({ url: businessMedia.blobUrl })
      .from(businessMedia)
      .where(
        and(
          eq(businessMedia.businessId, business.id),
          eq(businessMedia.type, 'photo'),
          eq(businessMedia.reviewStatus, 'approved'),
        ),
      )
      .orderBy(asc(businessMedia.sortOrder)),
    business.relocatedToBusinessId
      ? db.query.businesses.findFirst({
          where: eq(businesses.id, business.relocatedToBusinessId),
          columns: { id: true, slug: true, name: true },
        })
      : Promise.resolve(null),
  ]);

  const prem = activePremises.rows[0];
  const primary = cats.find((c) => c.isPrimary) ?? null;

  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    status: business.status,
    primaryCategory: primary
      ? { name: primary.name, slug: primary.slug, icon: primary.icon }
      : null,
    otherCategories: cats.filter((c) => !c.isPrimary).map((c) => ({ name: c.name, slug: c.slug })),
    area: prem?.area_name ? { name: prem.area_name, slug: prem.area_slug } : null,
    address: prem?.kind === 'physical' ? (prem.address_line ?? null) : null,
    location:
      prem?.kind === 'physical' && prem.lat !== null && prem.lng !== null
        ? { lat: Number(prem.lat), lng: Number(prem.lng) }
        : null,
    serviceAreaNote: prem?.kind === 'service_area' ? (prem.service_area_note ?? null) : null,
    logoUrl: logo[0]?.url ?? null,
    photoUrls: photos.map((p) => p.url),
    contact: {
      phone: business.phone,
      whatsapp: business.whatsapp,
      email: business.email,
      website: business.website,
      instagram: business.instagram,
      facebook: business.facebook,
    },
    openingHours: hours,
    relocatedTo: relocatedTo ?? null,
    lastUpdatedAt: showLastUpdated ? business.updatedAt : null,
  };
}
