# Practicas NestJS

Proyecto NestJS con módulos existentes y la API de reservas del laboratorio en memoria.

## Instalación

1. Entra a la carpeta del proyecto.
2. Ejecuta:
   npm install

## Ejecutar la API

npm run start

La API queda disponible en http://localhost:3000.

## Probar endpoints

- GET /reservas
- GET /reservas/:id
- POST /reservas
- DELETE /reservas/:id

Ejemplos con curl:

curl -i http://localhost:3000/reservas
curl -i http://localhost:3000/reservas/1
curl -i -X POST http://localhost:3000/reservas -H "Content-Type: application/json" -d '{"docente":"Rosa Ortiz","laboratorio":"Lab 3","hora":14}'

## Compilar

npm run build

## Evidencias

Las peticiones HTTP reales se guardan en la carpeta evidencias/ con salida curl -i numerada del 01 al 09.
