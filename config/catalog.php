<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Product images
    |--------------------------------------------------------------------------
    |
    | Disk must exist in config/filesystems.php. Use "s3" in production when
    | AWS credentials are configured, or "public" for local development.
    |
    */

    'images_disk' => env('PRODUCT_IMAGES_DISK', 'public'),

];
