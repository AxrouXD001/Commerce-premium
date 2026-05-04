<?php

namespace App\Enums;

enum StockMovementType: string
{
    case Reserve = 'reserve';

    case Commit = 'commit';

    case Release = 'release';

    case Restock = 'restock';

    case Adjust = 'adjust';
}
