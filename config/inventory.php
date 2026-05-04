<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Pedidos pendientes de pago
    |--------------------------------------------------------------------------
    |
    | Tras este número de días en estado pendiente, se cancelan y se liberan
    | las reservas de inventario (comando programado).
    |
    */
    'pendiente_order_ttl_days' => (int) env('INVENTORY_PENDIENTE_ORDER_TTL_DAYS', 7),

    'reorder_point_default' => (int) env('INVENTORY_REORDER_POINT_DEFAULT', 5),

];
