import 'dotenv/config';
import { and, eq, isNotNull } from 'drizzle-orm';
import { db } from '@/db';
import { adminUsers, importRows } from '@/db/schema';
import { toCsv } from '@/lib/csv';
import { IMPORT_COLUMNS, createImportBatch, commitImportBatch } from '@/lib/services/import-export';
import { changeStatus } from '@/lib/services/business-status';
import type { AdminIdentity } from '@/lib/auth-guards';

/**
 * One-off local-dev seeder: realistic dummy Cúcuta-area businesses, loaded
 * through the real import pipeline (so it's validated the same way a real CSV
 * would be) and then published. Everything it creates is tied to one import
 * batch, so `npm run seed:dummy:remove` can cleanly undo it later.
 */

const FILENAME = 'dummy-cucuta-businesses.csv';
const OWNER_EMAIL = 'martin.kellie@gmail.com';

type Row = Record<(typeof IMPORT_COLUMNS)[number], string>;

function row(r: Partial<Row> & { name: string }): Row {
  return Object.fromEntries(IMPORT_COLUMNS.map((c) => [c, r[c] ?? ''])) as Row;
}

const BUSINESSES: Row[] = [
  row({
    name: 'Ferretería El Tornillo Feliz',
    phone: '+57 607 5751023',
    primaryCategory: 'Ferreterías',
    productsServices: 'Herramientas y ferretería',
    area: 'Cúcuta',
    addressLine: 'Avenida 6 # 10-45',
    lat: '7.8971',
    lng: '-72.5041',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Ferretería Metales del Norte',
    phone: '+57 607 5661187',
    primaryCategory: 'Ferreterías',
    productsServices: 'Herramientas y ferretería',
    area: 'Puerto Santander',
    addressLine: 'Calle 5 # 3-10',
    lat: '8.3608',
    lng: '-72.4157',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Restaurante Sabor Santandereano',
    phone: '3211234567',
    whatsapp: '+57 321 1234567',
    primaryCategory: 'Restaurantes',
    secondaryCategories: 'Cafeterías y Heladerías',
    productsServices: 'Comida colombiana',
    area: 'Cúcuta',
    addressLine: 'Calle 13 # 2-18',
    instagram: '@saborsantandereano',
    lat: '7.8902',
    lng: '-72.5103',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Restaurante La Parrilla Fronteriza',
    phone: '3157654321',
    whatsapp: '+57 315 7654321',
    primaryCategory: 'Restaurantes',
    productsServices: 'Comida colombiana',
    area: 'Villa del Rosario',
    addressLine: 'Carrera 4 # 8-30',
    lat: '7.8361',
    lng: '-72.4718',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Panadería La Espiga Dorada',
    phone: '3104455667',
    whatsapp: '+57 310 4455667',
    primaryCategory: 'Panaderías',
    productsServices: 'Pan y pastelería',
    area: 'Los Patios',
    addressLine: 'Calle 10 # 6-12',
    lat: '7.8352',
    lng: '-72.5081',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Panadería Trigo Dorado',
    phone: '3186677889',
    primaryCategory: 'Panaderías',
    productsServices: 'Pan y pastelería',
    area: 'San Cayetano',
    addressLine: 'Calle Principal # 2-05',
    lat: '7.8783',
    lng: '-72.6228',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Supermercado La Economía',
    phone: '+57 607 5789012',
    primaryCategory: 'Supermercados y Tiendas',
    productsServices: 'Víveres y abarrotes',
    area: 'Villa del Rosario',
    addressLine: 'Avenida Venezuela # 12-40',
    lat: '7.8318',
    lng: '-72.4759',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Minimercado Todo Fácil',
    phone: '3123344556',
    whatsapp: '+57 312 3344556',
    primaryCategory: 'Supermercados y Tiendas',
    productsServices: 'Víveres y abarrotes',
    area: 'Cúcuta',
    addressLine: 'Carrera 15 # 20-33',
    lat: '7.8987',
    lng: '-72.5122',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Farmacia San Rafael',
    phone: '+57 607 5723344',
    primaryCategory: 'Farmacias y Droguerías',
    productsServices: 'Medicamentos y salud',
    area: 'Cúcuta',
    addressLine: 'Avenida 4 # 15-22',
    lat: '7.8915',
    lng: '-72.5057',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Farmacia Popular',
    phone: '3196655443',
    primaryCategory: 'Farmacias y Droguerías',
    productsServices: 'Medicamentos y salud',
    area: 'Los Patios',
    addressLine: 'Calle 8 # 4-19',
    lat: '7.8344',
    lng: '-72.5039',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Peluquería Estilo & Clase',
    phone: '3145566778',
    whatsapp: '+57 314 5566778',
    primaryCategory: 'Peluquerías y Barberías',
    productsServices: 'Corte de cabello',
    area: 'El Zulia',
    addressLine: 'Calle Real # 6-14',
    instagram: '@estiloyclase_zulia',
    lat: '7.9351',
    lng: '-72.5988',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Barbería El Corte Perfecto',
    phone: '3167788990',
    whatsapp: '+57 316 7788990',
    primaryCategory: 'Peluquerías y Barberías',
    productsServices: 'Corte de cabello',
    area: 'Cúcuta',
    addressLine: 'Carrera 9 # 11-27',
    lat: '7.8926',
    lng: '-72.5019',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Taller Mecánico Los Motores',
    phone: '+57 607 5798765',
    primaryCategory: 'Talleres de Mecánica',
    productsServices: 'Mecánica automotriz',
    area: 'Cúcuta',
    addressLine: 'Avenida Libertadores # 30-08',
    lat: '7.8862',
    lng: '-72.5145',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Taller Diesel Fronterizo',
    phone: '3178899001',
    primaryCategory: 'Talleres de Mecánica',
    productsServices: 'Mecánica automotriz',
    area: 'Villa del Rosario',
    addressLine: 'Carrera 2 # 5-16',
    lat: '7.8375',
    lng: '-72.4703',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Papelería El Estudiante',
    phone: '3132211334',
    primaryCategory: 'Papelerías y Librerías',
    productsServices: 'Útiles escolares',
    area: 'San Cayetano',
    addressLine: 'Calle Escolar # 1-09',
    lat: '7.8739',
    lng: '-72.6271',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Almacén de Ropa Moda Total',
    phone: '3119988776',
    whatsapp: '+57 311 9988776',
    primaryCategory: 'Ropa y Calzado',
    productsServices: 'Venta de ropa y calzado',
    area: 'Cúcuta',
    addressLine: 'Calle 11 # 5-40',
    facebook: 'ModaTotalCucuta',
    lat: '7.8949',
    lng: '-72.5095',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Consultorio Médico Vida Sana',
    phone: '+57 607 5734567',
    email: 'contacto@vidasanacucuta.co',
    primaryCategory: 'Salud y Consultorios',
    productsServices: 'Consulta médica general',
    area: 'Los Patios',
    addressLine: 'Calle 12 # 7-21',
    lat: '7.8317',
    lng: '-72.5074',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Spa y Estética Bella Piel',
    phone: '3201122334',
    whatsapp: '+57 320 1122334',
    primaryCategory: 'Belleza y Estética',
    productsServices: 'Tratamientos de belleza',
    area: 'Cúcuta',
    addressLine: 'Avenida 0 # 9-12',
    instagram: '@bellapiel_spa',
    lat: '7.8994',
    lng: '-72.5063',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'TecnoCel Reparaciones',
    phone: '3167712345',
    whatsapp: '+57 316 7712345',
    primaryCategory: 'Tecnología y Celulares',
    productsServices: 'Reparación de celulares',
    area: 'Villa del Rosario',
    addressLine: 'Carrera 6 # 9-05',
    lat: '7.8347',
    lng: '-72.4779',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Muebles El Hogar Feliz',
    phone: '+57 607 5711223',
    primaryCategory: 'Hogar y Muebles',
    productsServices: 'Muebles para el hogar',
    area: 'Cúcuta',
    addressLine: 'Avenida 7 # 18-50',
    lat: '7.8878',
    lng: '-72.5006',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Materiales Andino',
    phone: '+57 607 5744556',
    primaryCategory: 'Materiales de Construcción',
    productsServices: 'Venta de materiales de construcción',
    area: 'El Zulia',
    addressLine: 'Carrera 3 # 4-08',
    lat: '7.9382',
    lng: '-72.6042',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Servicios del Hogar JR',
    phone: '3141122334',
    whatsapp: '+57 314 1122334',
    primaryCategory: 'Servicios para el Hogar',
    productsServices: 'Plomería y electricidad',
    area: 'Cúcuta',
    premisesKind: 'service_area',
    serviceAreaNote: 'Cúcuta y Los Patios',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Aires Acondicionados Frescolandia',
    phone: '3152233445',
    whatsapp: '+57 315 2233445',
    primaryCategory: 'Servicios para el Hogar',
    productsServices: 'Aire acondicionado',
    area: 'Cúcuta',
    premisesKind: 'service_area',
    serviceAreaNote: 'Cúcuta, Los Patios y Villa del Rosario',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Distribuidora de Gas El Zulia',
    phone: '3163344556',
    whatsapp: '+57 316 3344556',
    primaryCategory: 'Servicios para el Hogar',
    productsServices: 'Recarga de gas doméstico',
    area: 'El Zulia',
    addressLine: 'Calle Principal # 7-11',
    lat: '7.9358',
    lng: '-72.6001',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Aguas El Manantial',
    phone: '3174455667',
    whatsapp: '+57 317 4455667',
    primaryCategory: 'Servicios para el Hogar',
    productsServices: 'Dispensadores de agua',
    area: 'Cúcuta',
    addressLine: 'Carrera 11 # 22-14',
    lat: '7.9002',
    lng: '-72.5148',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Café Aroma de Cúcuta',
    phone: '3187766554',
    primaryCategory: 'Cafeterías y Heladerías',
    secondaryCategories: 'Panaderías',
    productsServices: 'Café y postres',
    area: 'Cúcuta',
    addressLine: 'Avenida 5 # 13-08',
    instagram: '@aromadecucuta',
    lat: '7.8933',
    lng: '-72.5089',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Heladería Polo Norte',
    phone: '3129988001',
    primaryCategory: 'Cafeterías y Heladerías',
    productsServices: 'Café y postres',
    area: 'Cúcuta',
    addressLine: 'Calle 17 # 3-22',
    lat: '7.8967',
    lng: '-72.5157',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Veterinaria Patitas Felices',
    phone: '3135566332',
    whatsapp: '+57 313 5566332',
    primaryCategory: 'Mascotas y Veterinarias',
    productsServices: 'Consulta veterinaria',
    area: 'Los Patios',
    addressLine: 'Calle 6 # 9-17',
    lat: '7.8309',
    lng: '-72.5028',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Transportes Rápidos del Norte',
    phone: '3208877665',
    whatsapp: '+57 320 8877665',
    primaryCategory: 'Transporte y Mensajería',
    productsServices: 'Mensajería y encomiendas',
    area: 'Cúcuta',
    premisesKind: 'service_area',
    serviceAreaNote: 'Área metropolitana de Cúcuta',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Domicilios Rápidos Cúcuta',
    phone: '3219900112',
    whatsapp: '+57 321 9900112',
    primaryCategory: 'Transporte y Mensajería',
    productsServices: 'Domicilios de comida',
    area: 'Cúcuta',
    premisesKind: 'service_area',
    serviceAreaNote: 'Cúcuta urbana',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Academia de Inglés Fluent Cúcuta',
    phone: '+57 607 5766778',
    email: 'info@fluentcucuta.co',
    website: 'https://fluentcucuta.co',
    primaryCategory: 'Educación y Academias',
    productsServices: 'Clases de inglés',
    area: 'Cúcuta',
    addressLine: 'Avenida 3 # 16-20',
    lat: '7.8908',
    lng: '-72.4998',
    sourceNote: 'dummy seed data',
  }),
  row({
    name: 'Contadores & Asesores CVA',
    phone: '+57 607 5722110',
    email: 'contacto@cvacontadores.co',
    primaryCategory: 'Servicios Profesionales',
    productsServices: 'Asesoría contable',
    area: 'Cúcuta',
    addressLine: 'Calle 14 # 4-33',
    lat: '7.8921',
    lng: '-72.5112',
    sourceNote: 'dummy seed data',
  }),
];

async function main() {
  const owner = await db.query.adminUsers.findFirst({ where: eq(adminUsers.email, OWNER_EMAIL) });
  if (!owner) {
    throw new Error(`Admin user not found: ${OWNER_EMAIL} — run "npm run admin:add" first.`);
  }
  const actor: AdminIdentity = {
    adminId: owner.id,
    role: 'owner',
    email: owner.email,
    name: owner.name,
  };

  const csv = toCsv([[...IMPORT_COLUMNS], ...BUSINESSES.map((b) => IMPORT_COLUMNS.map((c) => b[c]))]);
  const file = new File([csv], FILENAME, { type: 'text/csv' });

  const batch = await createImportBatch(file, 'csv', actor);
  console.log(`Import batch ${batch.id}: ${batch.validRows}/${batch.totalRows} rows valid.`);

  if (batch.errorRows > 0) {
    const failed = await db.query.importRows.findMany({
      where: and(eq(importRows.batchId, batch.id), eq(importRows.ok, false)),
    });
    for (const f of failed) {
      console.warn(`  Row ${f.rowNumber} (${f.raw.name}):`, f.errors);
    }
  }

  const committed = await commitImportBatch(batch.id, actor);
  console.log(`Committed ${committed.committedRows} businesses as drafts.`);

  const committedRows = await db
    .select({ businessId: importRows.businessId, name: importRows.raw })
    .from(importRows)
    .where(and(eq(importRows.batchId, batch.id), isNotNull(importRows.businessId)));

  let published = 0;
  for (const r of committedRows) {
    if (!r.businessId) continue;
    try {
      await changeStatus(r.businessId, { status: 'active' }, actor);
      published += 1;
    } catch (error) {
      console.warn(
        `  Could not publish "${r.name.name}":`,
        error instanceof Error ? error.message : error,
      );
    }
  }
  console.log(`Published ${published}/${committedRows.length} businesses as active.`);
  console.log(`\nBatch id (for cleanup): ${batch.id}`);
  console.log(`To remove this dummy data later: npm run seed:dummy:remove`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
