import 'dotenv/config';
import { sql } from 'drizzle-orm';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

/**
 * Seeds reference data:
 *   - the singleton `system_settings` row
 *   - launch areas (Cúcuta metro) with approximate centroids
 *   - starter categories with fallback icons
 *   - a small set of example product/service concepts + synonyms so search can
 *     be exercised before real content is loaded
 *
 * Idempotent: safe to run repeatedly (conflicts on slug / id are ignored).
 */

type AreaSeed = { name: string; slug: string; lat: number; lng: number; sortOrder: number };

const AREAS: AreaSeed[] = [
  { name: 'Cúcuta', slug: 'cucuta', lat: 7.8939, lng: -72.5078, sortOrder: 0 },
  { name: 'Los Patios', slug: 'los-patios', lat: 7.833, lng: -72.506, sortOrder: 1 },
  {
    name: 'Villa del Rosario',
    slug: 'villa-del-rosario',
    lat: 7.8339,
    lng: -72.4741,
    sortOrder: 2,
  },
  { name: 'El Zulia', slug: 'el-zulia', lat: 7.9367, lng: -72.601, sortOrder: 3 },
  { name: 'San Cayetano', slug: 'san-cayetano', lat: 7.876, lng: -72.625, sortOrder: 4 },
  { name: 'Puerto Santander', slug: 'puerto-santander', lat: 8.3625, lng: -72.4133, sortOrder: 5 },
];

type CategorySeed = {
  name: string;
  slug: string;
  icon: string;
  popular?: boolean;
};

// Names are Spanish (public site is Spanish only). Icons are lucide-react keys;
// Cursor maps them to the final assets.
const CATEGORIES: CategorySeed[] = [
  { name: 'Ferreterías', slug: 'ferreterias', icon: 'hammer', popular: true },
  { name: 'Restaurantes', slug: 'restaurantes', icon: 'utensils', popular: true },
  { name: 'Panaderías', slug: 'panaderias', icon: 'croissant', popular: true },
  {
    name: 'Supermercados y Tiendas',
    slug: 'supermercados-y-tiendas',
    icon: 'shopping-cart',
    popular: true,
  },
  { name: 'Farmacias y Droguerías', slug: 'farmacias-y-droguerias', icon: 'pill', popular: true },
  {
    name: 'Peluquerías y Barberías',
    slug: 'peluquerias-y-barberias',
    icon: 'scissors',
    popular: true,
  },
  { name: 'Talleres de Mecánica', slug: 'talleres-de-mecanica', icon: 'wrench', popular: true },
  {
    name: 'Papelerías y Librerías',
    slug: 'papelerias-y-librerias',
    icon: 'book-open',
    popular: true,
  },
  { name: 'Ropa y Calzado', slug: 'ropa-y-calzado', icon: 'shirt' },
  { name: 'Salud y Consultorios', slug: 'salud-y-consultorios', icon: 'stethoscope' },
  { name: 'Belleza y Estética', slug: 'belleza-y-estetica', icon: 'sparkles' },
  { name: 'Tecnología y Celulares', slug: 'tecnologia-y-celulares', icon: 'smartphone' },
  { name: 'Hogar y Muebles', slug: 'hogar-y-muebles', icon: 'sofa' },
  { name: 'Materiales de Construcción', slug: 'materiales-de-construccion', icon: 'brick-wall' },
  { name: 'Servicios para el Hogar', slug: 'servicios-para-el-hogar', icon: 'house' },
  { name: 'Cafeterías y Heladerías', slug: 'cafeterias-y-heladerias', icon: 'coffee' },
  { name: 'Mascotas y Veterinarias', slug: 'mascotas-y-veterinarias', icon: 'paw-print' },
  { name: 'Transporte y Mensajería', slug: 'transporte-y-mensajeria', icon: 'truck' },
  { name: 'Educación y Academias', slug: 'educacion-y-academias', icon: 'graduation-cap' },
  { name: 'Servicios Profesionales', slug: 'servicios-profesionales', icon: 'briefcase' },
];

type ConceptSeed = { name: string; slug: string; synonyms: string[] };

const CONCEPTS: ConceptSeed[] = [
  {
    name: 'Dispensadores de agua',
    slug: 'dispensadores-de-agua',
    synonyms: [
      'bebedero',
      'botellón de agua',
      'bombona de agua',
      'water cooler',
      'enfriador de agua',
    ],
  },
  {
    name: 'Aire acondicionado',
    slug: 'aire-acondicionado',
    synonyms: ['aires', 'clima', 'split', 'mini split', 'refrigeración'],
  },
  {
    name: 'Recarga de gas doméstico',
    slug: 'recarga-de-gas-domestico',
    synonyms: ['pipeta de gas', 'cilindro de gas', 'gas propano', 'gas de cocina'],
  },
  {
    name: 'Reparación de celulares',
    slug: 'reparacion-de-celulares',
    synonyms: ['arreglo de celulares', 'cambio de pantalla', 'servicio técnico de celulares'],
  },
  {
    name: 'Domicilios de comida',
    slug: 'domicilios-de-comida',
    synonyms: ['comida a domicilio', 'delivery', 'pedidos a domicilio'],
  },
  { name: 'Herramientas y ferretería', slug: 'herramientas-y-ferreteria', synonyms: [] },
  { name: 'Comida colombiana', slug: 'comida-colombiana', synonyms: [] },
  { name: 'Pan y pastelería', slug: 'pan-y-pasteleria', synonyms: [] },
  { name: 'Víveres y abarrotes', slug: 'viveres-y-abarrotes', synonyms: [] },
  { name: 'Medicamentos y salud', slug: 'medicamentos-y-salud', synonyms: [] },
  { name: 'Corte de cabello', slug: 'corte-de-cabello', synonyms: [] },
  { name: 'Mecánica automotriz', slug: 'mecanica-automotriz', synonyms: [] },
  { name: 'Útiles escolares', slug: 'utiles-escolares', synonyms: [] },
  { name: 'Venta de ropa y calzado', slug: 'venta-de-ropa-y-calzado', synonyms: [] },
  { name: 'Consulta médica general', slug: 'consulta-medica-general', synonyms: [] },
  { name: 'Tratamientos de belleza', slug: 'tratamientos-de-belleza', synonyms: [] },
  { name: 'Muebles para el hogar', slug: 'muebles-para-el-hogar', synonyms: [] },
  {
    name: 'Venta de materiales de construcción',
    slug: 'venta-de-materiales-de-construccion',
    synonyms: [],
  },
  { name: 'Plomería y electricidad', slug: 'plomeria-y-electricidad', synonyms: [] },
  { name: 'Café y postres', slug: 'cafe-y-postres', synonyms: [] },
  { name: 'Consulta veterinaria', slug: 'consulta-veterinaria', synonyms: [] },
  { name: 'Mensajería y encomiendas', slug: 'mensajeria-y-encomiendas', synonyms: [] },
  { name: 'Clases de inglés', slug: 'clases-de-ingles', synonyms: [] },
  { name: 'Asesoría contable', slug: 'asesoria-contable', synonyms: [] },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  const pool = new pg.Pool({ connectionString, max: 1 });
  const db = drizzle(pool, { schema });

  await db
    .insert(schema.systemSettings)
    .values({ id: 'global' })
    .onConflictDoNothing({ target: schema.systemSettings.id });

  for (const area of AREAS) {
    await db
      .insert(schema.areas)
      .values({
        name: area.name,
        slug: area.slug,
        sortOrder: area.sortOrder,
        centroid: sql`ST_SetSRID(ST_MakePoint(${area.lng}, ${area.lat}), 4326)::geography`,
      })
      .onConflictDoNothing({ target: schema.areas.slug });
  }

  for (const [i, category] of CATEGORIES.entries()) {
    await db
      .insert(schema.categories)
      .values({
        name: category.name,
        slug: category.slug,
        fallbackIcon: category.icon,
        isPopular: category.popular ?? false,
        sortOrder: i,
        status: 'approved',
      })
      .onConflictDoNothing({ target: schema.categories.slug });
  }

  for (const concept of CONCEPTS) {
    const [row] = await db
      .insert(schema.productsServices)
      .values({ name: concept.name, slug: concept.slug, status: 'approved' })
      .onConflictDoNothing({ target: schema.productsServices.slug })
      .returning({ id: schema.productsServices.id });

    // Resolve the id whether it was just inserted or already existed.
    const conceptId =
      row?.id ??
      (
        await db.query.productsServices.findFirst({
          where: (t, { eq }) => eq(t.slug, concept.slug),
          columns: { id: true },
        })
      )?.id;
    if (!conceptId) continue;

    for (const term of concept.synonyms) {
      await db
        .insert(schema.synonyms)
        .values({
          term,
          scope: 'product_service',
          productServiceId: conceptId,
          status: 'approved',
        })
        .onConflictDoNothing();
    }
  }

  const counts = await db.execute(sql`
    select
      (select count(*) from areas) as areas,
      (select count(*) from categories) as categories,
      (select count(*) from products_services) as concepts,
      (select count(*) from synonyms) as synonyms
  `);
  console.log('Seed complete:', counts.rows[0]);

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
