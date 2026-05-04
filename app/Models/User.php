<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Rol de Spatie asignado en el alta por formulario o API: el primer usuario del sistema es administrador; el resto, cliente.
     */
    public static function defaultRoleNameForNewRegistration(): string
    {
        return static::query()->count() === 0 ? 'admin' : 'cliente';
    }

    /**
     * Crea el rol en BD si no existe (despliegues que solo ejecutaron migrate, sin seed).
     */
    public static function ensureSpatieRoleExists(string $roleName): void
    {
        Role::findOrCreate($roleName);
    }

    /**
     * @return HasMany<Order, $this>
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class)->latest();
    }

    /**
     * @return HasOne<Customer, $this>
     */
    public function customerProfile(): HasOne
    {
        return $this->hasOne(Customer::class);
    }
}
