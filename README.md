# Bussines Control ASP

Aplicacion React + Vite para la gestion de agenda y control operativo.

## Desarrollo local

```bash
npm install
npm run dev
```

## Build de produccion

```bash
npm run build
```

## Docker

La imagen compila la app con Node y la sirve con Nginx.

Construir la imagen:

```bash
docker build -t bussines-control-asp .
```

Levantar el contenedor:

```bash
docker run --rm -p 8080:80 bussines-control-asp
```

La aplicacion quedara disponible en `http://localhost:8080`.

## Login con Google

Para habilitar el acceso con Google en local o produccion, define la variable:

```bash
VITE_GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
```

En Google Cloud Console debes registrar como `Authorized JavaScript origins` el origen donde corre la app, por ejemplo:

```bash
http://localhost:5173
https://tu-servicio.run.app
```
