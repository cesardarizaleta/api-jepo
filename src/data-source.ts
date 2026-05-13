import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

const dbUrl = process.env.DB_URL;
if (!dbUrl) {
  throw new Error('DB_URL es requerida para ejecutar migraciones');
}

const parsedUrl = new URL(dbUrl);
const schema =
  parsedUrl.searchParams.get('schema') ?? 'asistencia_proactiva';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: dbUrl,
  schema,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: ['error', 'migration'],
});
