<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * Los mismos roles que RolePermissionSeeder, para despliegues con migrate pero sin db:seed.
     */
    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (['admin', 'vendedor', 'cliente'] as $roleName) {
            Role::findOrCreate($roleName);
        }
    }

    /**
     * No eliminamos roles aquí para no romper asignaciones existentes.
     */
    public function down(): void
    {
        //
    }
};
