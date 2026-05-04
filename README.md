# Entregable Web

Aplicación **Laravel 12** + **Inertia.js v2** + **React 19** + **Tailwind CSS v4**. Incluye API con **Sanctum**, catálogo, carrito, pagos (Stripe) y roles con **Spatie Permission**.

Esta guía está pensada para desplegar en **Amazon EC2 con Linux** (Amazon Linux 2023 o Ubuntu Server). Ajusta rutas y nombres de usuario del servidor según tu entorno.

---

## 1. Requisitos del servidor

| Componente | Versión recomendada |
|------------|---------------------|
| PHP | **8.2 o 8.3** (extensiones: `bcmath`, `ctype`, `curl`, `fileinfo`, `json`, `mbstring`, `openssl`, `pdo`, `tokenizer`, `xml`, `zip`; y `pdo_mysql` si usas MySQL) |
| Composer | 2.x |
| Node.js | **20 LTS** o superior (para `npm run build`) |
| Base de datos | **MySQL 8** / **MariaDB 10.11+** (recomendado en producción) o SQLite solo para pruebas mínimas |
| Servidor web | **Nginx** + **PHP-FPM** (o Apache con `mod_php` / proxy a PHP-FPM) |

Opcional según funciones que uses:

- **Redis** (si cambias `CACHE_STORE` o `QUEUE_CONNECTION` a `redis`).
- Servicio Node externo solo si configuras búsqueda Meilisearch/Node, socket de inventario o webhooks avanzados (las URLs en `.env` pueden quedar vacías: la app sigue funcionando con búsqueda en base de datos y sin socket).

---

## 2. Paquetes en el sistema (EC2)

### Amazon Linux 2023

```bash
sudo dnf update -y
sudo dnf install -y git nginx

# PHP 8.2 y extensiones (grupo/amazon-linux-extras o repositorio de PHP según imagen AMI)
sudo dnf install -y \
  php php-cli php-fpm php-common \
  php-mbstring php-xml php-bcmath php-json \
  php-mysqlnd php-pdo php-opcache php-curl php-zip php-gd php-intl

# Composer (instalación oficial)
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php --install-dir=/usr/local/bin --filename=composer
php -r "unlink('composer-setup.php');"

# Node.js 20 LTS (ejemplo con NodeSource; ver documentación actual)
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
```

Si tu AMI no incluye todos los paquetes `php-*`, instala los que falten con `dnf search php-` o usa el repositorio **Remi** para PHP según la documentación de tu distribución.

### Ubuntu 22.04 / 24.04 (referencia)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx php8.2-fpm php8.2-cli php8.2-mysql php8.2-xml \
  php8.2-mbstring php8.2-curl php8.2-zip php8.2-bcmath php8.2-intl unzip
# Composer: seguir https://getcomposer.org/download/
# Node: https://github.com/nodesource/distributions
```

---

## 3. Código en el servidor

```bash
# Ejemplo: aplicación en /var/www/entregable-web
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www

git clone <URL_DE_TU_REPOSITORIO> entregable-web
cd entregable-web
```

---

## 4. PHP — dependencias (Composer)

```bash
composer install --no-dev --optimize-autoloader
```

Para un entorno de **desarrollo** en el servidor (no recomendado en producción):

```bash
composer install
```

---

## 5. Frontend — build (Vite)

```bash
npm ci
npm run build
```

Esto genera los assets en `public/build`. Sin este paso, Inertia/Vite no encontrará el manifiesto y verás errores tipo *Unable to locate file in Vite manifest*.

---

## 6. Variables de entorno

```bash
cp .env.example .env
php artisan key:generate
```

Edita `.env` como mínimo:

| Variable | Producción |
|----------|------------|
| `APP_NAME` | Nombre de la app |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_URL` | `https://tudominio.com` (sin barra final) |
| `DB_CONNECTION` | `mysql` (recomendado) |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Credenciales reales |
| `SESSION_DRIVER` | `database` (requiere migraciones; ya viene en `.env.example`) |
| `QUEUE_CONNECTION` | `database` (requiere worker; ver sección 9) |
| `CACHE_STORE` | `database` o `file` / `redis` |

Crea la base de datos vacía en MySQL/MariaDB antes de migrar:

```sql
CREATE DATABASE entregable CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'entregable'@'localhost' IDENTIFIED BY 'contraseña_segura';
GRANT ALL PRIVILEGES ON entregable.* TO 'entregable'@'localhost';
FLUSH PRIVILEGES;
```

Opcionales (solo si usas esas integraciones):

- **Stripe:** `STRIPE_KEY`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`
- **Búsqueda externa:** `SEARCH_SERVICE_URL`, `SEARCH_SYNC_TOKEN`
- **Socket inventario:** `INVENTORY_SOCKET_EMIT_URL`, `INVENTORY_SOCKET_CLIENT_URL`, `INVENTORY_SOCKET_TOKEN`

---

## 7. Base de datos, enlace de storage y optimización

```bash
php artisan migrate --force
```

Datos de demostración (roles, catálogo, cupones, usuario de prueba):

```bash
php artisan db:seed --force
```

Enlace para archivos públicos (imágenes de productos en disco `public`):

```bash
php artisan storage:link
```

Cachés de configuración y rutas (producción):

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Tras cambiar `.env` en producción, vuelve a ejecutar `php artisan config:cache`.

---

## 8. Permisos (Laravel)

El usuario con el que corre **PHP-FPM** debe poder escribir en `storage` y `bootstrap/cache`:

```bash
sudo chown -R nginx:nginx /var/www/entregable-web/storage /var/www/entregable-web/bootstrap/cache
sudo chmod -R ug+rwx storage bootstrap/cache
```

Sustituye `nginx:nginx` por `www-data:www-data` en Ubuntu si aplica.

---

## 9. Colas y programador (cron)

Con `QUEUE_CONNECTION=database` hace falta un proceso que procese trabajos:

```bash
php artisan queue:work --sleep=3 --tries=3 --max-time=3600
```

En producción usa **Supervisor** (o **systemd**) para mantener `queue:work` activo. Ejemplo mínimo de unidad systemd (`/etc/systemd/system/entregable-queue.service`):

```ini
[Unit]
Description=Entregable queue worker
After=network.target

[Service]
User=nginx
Group=nginx
Restart=always
ExecStart=/usr/bin/php /var/www/entregable-web/artisan queue:work --sleep=3 --tries=3

[Install]
WantedBy=multi-user.target
```

El **scheduler** de Laravel (`routes/console.php` / `bootstrap/app.php`):

```bash
sudo crontab -e -u nginx
```

Añade:

```cron
* * * * * cd /var/www/entregable-web && /usr/bin/php artisan schedule:run >> /dev/null 2>&1
```

(Ajusta usuario y ruta de `php` con `which php`.)

---

## 10. Nginx + PHP-FPM (resumen)

- `root` del sitio debe apuntar al directorio **`public`** del proyecto, no al raíz del repo.
- Incluye `try_files` para enviar todo a `index.php` (front controller).
- Si usas **HTTPS detrás de un balanceador AWS**, configura `TrustProxies` en Laravel y `APP_URL` con `https://`.

Ejemplo de bloque `server` (ajusta `server_name`, rutas y socket de PHP-FPM):

```nginx
server {
    listen 80;
    server_name tudominio.com;
    root /var/www/entregable-web/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/run/php-fpm/www.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Recarga Nginx: `sudo systemctl reload nginx`.

---

## 11. Comprobación rápida

- Salud HTTP: `curl -sS https://tudominio.com/up` (ruta `/up` definida en Laravel 12).
- Logs: `storage/logs/laravel.log`.
- Si la UI carga sin estilos o falla Vite: confirma `npm run build` y que exista `public/build/manifest.json`.

---

## 12. Usuarios y roles (tras `db:seed`)

El seeder crea un usuario de prueba `test@example.com` con rol **cliente** (además de roles `admin`, `vendedor`, `cliente`).

**Registro público:** si la tabla `users` está **vacía** antes de crear el usuario, el **primer registro** por web o API recibe rol **admin**; los siguientes, **cliente**. Si ya ejecutaste `db:seed`, ya existe un usuario y el primer registro manual será **cliente** (puedes promover a admin con tinker o editando roles en base de datos).

---

## 13. Desarrollo local (referencia)

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan storage:link
npm ci
npm run dev   # en otra terminal, o usar:
composer run dev   # sirve Laravel + cola + Vite según composer.json
```

---

## 14. Tests (CI o máquina de desarrollo)

```bash
composer install   # incluye dependencias de desarrollo
php artisan test --compact
```

---

## Checklist antes de dar por cerrado el despliegue

- [ ] `APP_KEY` generado y `.env` con `APP_DEBUG=false`, `APP_URL` correcto.
- [ ] Base de datos creada y `php artisan migrate --force` sin errores.
- [ ] `npm run build` ejecutado tras cada cambio de front que vaya a producción.
- [ ] `php artisan storage:link` y permisos en `storage` y `bootstrap/cache`.
- [ ] `php artisan config:cache` (y `route:cache` / `view:cache` si aplica).
- [ ] Worker de colas activo si usas colas asíncronas.
- [ ] Cron de `schedule:run` si usas tareas programadas.
- [ ] Nginx `root` en `public/` y PHP-FPM operativo.
- [ ] Firewall / grupo de seguridad EC2: puertos 80/443 abiertos al tráfico necesario.

Si indicas la AMI exacta (Amazon Linux 2023 vs Ubuntu) y si usarás RDS o MySQL local, se pueden acotar los bloques de instalación de PHP y MySQL al 100 % de tu entorno.
