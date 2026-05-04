<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pendiente = 'pendiente';

    case Confirmado = 'confirmado';

    case EnProceso = 'en_proceso';

    case Enviado = 'enviado';

    case Entregado = 'entregado';

    case Cancelado = 'cancelado';
}
