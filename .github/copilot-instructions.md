# Proyecto NestJS + Prisma

- Backend NestJS con TypeScript y Prisma ORM fijado en 7.9.1.
- PostgreSQL se conecta mediante `@prisma/adapter-pg`; la URL se configura con `DATABASE_URL`.
- Prisma Client se genera en `src/generated/prisma`; ejecuta `npm run prisma:generate` tras instalar dependencias o cambiar el schema.
- No guardes secretos en el repositorio. `.env.example` contiene únicamente valores de ejemplo.
- Usa los scripts documentados en `package.json` para compilar, ejecutar y migrar.
