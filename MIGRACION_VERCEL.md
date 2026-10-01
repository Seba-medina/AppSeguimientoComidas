# Vercel y copia de sebas (septiembre de 2026)

Esta rama conserva el sitio de Netlify y agrega la versión de Vercel. No se ha desplegado ni copiado ningún dato todavía.

## 1. Descargar desde Netlify

Integrar esta rama en main para que Netlify publique el exportador. Abrir:
https://registrodecomidas.netlify.app/migrar-sebas.html

Ingresar la contraseña de **sebas** en esa página y descargar `backup-sebas-2026-09.json`. Incluye únicamente septiembre, fotos extra y opciones guardadas de sebas. No incluye la contraseña ni ninguna otra cuenta. No subir la copia al repositorio.

## 2. Configurar Vercel

Importar `Seba-medina/AppSeguimientoComidas` desde GitHub en Vercel. Framework: **Other**, directorio raíz: el repositorio, sin comando de build, salida: **public**. La configuración está en vercel.json. Usar Node.js 24 y Fluid Compute.

En Storage/Marketplace conectar **Neon Postgres** al proyecto. Verificar que exista `DATABASE_URL` en Production y Preview. Configurar `ADMIN_PASSWORD` con una contraseña propia. No usar la clave de administrador en el navegador público ni guardarla en Git.

En el editor SQL de Neon ejecutar `scripts/schema.sql`. Volver a desplegar si las variables se agregaron después del primer despliegue. Abrir el enlace de Vercel y **registrar sebas**, eligiendo la contraseña que vas a usar. Hacer esto antes de importar.

Se mantiene el modelo de acceso de la app: un enlace con ?u= permite leer; modificar requiere contraseña. Esta migración no modifica ese sistema. Fotos y registros se guardan como bytea y JSON en Neon, una solución para el volumen pequeño de esta app; revisar el espacio utilizado y considerar almacenamiento de objetos separado si crece el historial fotográfico.

## 3. Importar y verificar

En una copia local del repositorio:

```bash
npm ci
```

Crear `.env.local` con la `DATABASE_URL` del mismo entorno donde registraste sebas (no compartirla). Copiar allí el archivo descargado y ejecutar:

```bash
node --env-file=.env.local scripts/import-sebas.mjs backup-sebas-2026-09.json
```

El importador valida el usuario, las fechas, todas las claves y SHA-256 antes de escribir. Inserta en una transacción y no sobrescribe registros existentes. Después compara los bytes y metadata leídos del destino. Puede repetirse con la misma copia; ante una diferencia informa un conflicto y conserva el registro existente.

## 4. Comprobar la app publicada

Entrar como sebas, revisar varios días de septiembre y sus fotos, descripciones, actividades, métricas y puntajes; generar un PDF de septiembre. Probar una foto nueva, editar descripción, agregar/eliminar una extra y cambiar contraseña. Abrir ?u=sebas en una ventana privada para comprobar la lectura compartida.

Mantener Netlify activo hasta verificar estos pasos. El acceso directo del celular y los enlaces compartidos deberán actualizarse a la dirección de Vercel. El exportador permanece exclusivamente en Netlify; en Vercel no se expone la ruta de exportación.

## Verificación local

```bash
node --test tests/*.test.mjs
```

Las pruebas locales comprueban alcance, multipart, bytes de imágenes y enrutamiento. La conexión real a Neon, el despliegue y el PDF completo requieren configurar los servicios y ejecutar la comprobación publicada.
