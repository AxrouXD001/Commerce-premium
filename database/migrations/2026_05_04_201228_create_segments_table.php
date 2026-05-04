<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('segments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            /** tag | group */
            $table->string('kind', 16);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        $now = now();
        DB::table('segments')->insert([
            [
                'name' => 'VIP',
                'slug' => 'vip',
                'kind' => 'tag',
                'description' => 'Clientes de alto valor',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Mayorista',
                'slug' => 'mayorista',
                'kind' => 'group',
                'description' => 'Compras recurrentes por volumen',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Retail',
                'slug' => 'retail',
                'kind' => 'group',
                'description' => 'Compra minorista',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('segments');
    }
};
