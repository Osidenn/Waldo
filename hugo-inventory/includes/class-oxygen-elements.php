<?php

namespace Hugo_Inventory;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Registers Oxygen Classic custom elements for Hugo Inventory.
 *
 * Element implementation classes (which extend OxyEl) live in
 * oxygen-element-impl.php and are required at runtime only after
 * confirming that OxyEl exists — preventing a fatal on sites where
 * Oxygen Builder is not installed.
 */
class OxygenElements {

    public function __construct() {
        add_action( 'init', [ $this, 'register' ], 2 );
    }

    public function register(): void {
        if ( ! class_exists( 'OxyEl' ) ) {
            return;
        }
        require_once HUGO_INV_PLUGIN_DIR . 'includes/oxygen-element-impl.php';
        new \Hugo_Inv_Oxygen_Add_Asset();
        new \Hugo_Inv_Oxygen_Assets_Table();
    }
}
