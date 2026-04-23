<?php
/**
 * Oxygen Classic element implementation classes.
 *
 * NOT autoloaded — only require_once'd from OxygenElements::register()
 * after class_exists('OxyEl') is confirmed true.
 *
 * Classes are intentionally in the global namespace so OxyEl can find them.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Build a shortcode string from a tag and attribute array.
 * Only non-empty values are included.
 */
function hugo_inv_oxy_build_sc( string $tag, array $atts ): string {
    $str = '[' . $tag;
    foreach ( $atts as $k => $v ) {
        if ( $v !== '' && $v !== null ) {
            $str .= ' ' . $k . '="' . str_replace( '"', '&quot;', (string) $v ) . '"';
        }
    }
    $str .= ']';
    return $str;
}

// ── Element: Add Asset button + modal ─────────────────────────────────────────

class Hugo_Inv_Oxygen_Add_Asset extends OxyEl {

    public function init(): void {}

    public function afterInit(): void {
        $this->removeApplyParamsButton();
    }

    public function name(): string {
        return 'Hugo Inv: Add Asset';
    }

    public function slug(): string {
        return 'hugo-inv-add-asset';
    }

    public function icon(): string {
        return CT_FW_URI . '/toolbar/UI/oxygen-icons/add-icons/heading.svg';
    }

    public function controls(): void {

        $ctrl = $this->addOptionControl( [
            'type'  => 'textfield',
            'name'  => 'Button Label',
            'slug'  => 'label',
            'value' => 'Add Asset',
        ] );
        $ctrl->rebuildElementOnChange();

        $section = $this->addControlSection( 'appearance', 'Appearance', 'assets/icon.svg', $this );

        $ctrl = $section->addOptionControl( [
            'type'  => 'colorpicker',
            'name'  => 'Button Color',
            'slug'  => 'bg_color',
            'value' => '#0073aa',
        ] );
        $ctrl->rebuildElementOnChange();

        $ctrl = $section->addOptionControl( [
            'type'  => 'colorpicker',
            'name'  => 'Button Text Color',
            'slug'  => 'text_color',
            'value' => '#ffffff',
        ] );
        $ctrl->rebuildElementOnChange();

        $ctrl = $section->addOptionControl( [
            'type'  => 'textfield',
            'name'  => 'Font Size (e.g. 16px)',
            'slug'  => 'font_size',
            'value' => '',
        ] );
        $ctrl->rebuildElementOnChange();

        $ctrl = $section->addOptionControl( [
            'type'  => 'textfield',
            'name'  => 'Border Radius (e.g. 6px)',
            'slug'  => 'radius',
            'value' => '',
        ] );
        $ctrl->rebuildElementOnChange();

        $ctrl = $section->addOptionControl( [
            'type'  => 'textfield',
            'name'  => 'Modal Max Width (e.g. 640px)',
            'slug'  => 'modal_width',
            'value' => '640px',
        ] );
        $ctrl->rebuildElementOnChange();
    }

    public function render( $options, $defaults, $content ): void {
        $sc = hugo_inv_oxy_build_sc( 'hugo_inv_add_asset', [
            'label'       => $options['label']       ?? 'Add Asset',
            'bg_color'    => $options['bg_color']    ?? '',
            'text_color'  => $options['text_color']  ?? '',
            'font_size'   => $options['font_size']   ?? '',
            'radius'      => $options['radius']      ?? '',
            'modal_width' => $options['modal_width'] ?? '',
        ] );
        // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
        echo do_shortcode( $sc );
    }
}

// ── Element: Assets Table ──────────────────────────────────────────────────────

class Hugo_Inv_Oxygen_Assets_Table extends OxyEl {

    public function init(): void {}

    public function afterInit(): void {
        $this->removeApplyParamsButton();
    }

    public function name(): string {
        return 'Hugo Inv: Assets Table';
    }

    public function slug(): string {
        return 'hugo-inv-assets-table';
    }

    public function icon(): string {
        return CT_FW_URI . '/toolbar/UI/oxygen-icons/add-icons/heading.svg';
    }

    public function controls(): void {

        $filters = $this->addControlSection( 'filters', 'Filters', 'assets/icon.svg', $this );

        $ctrl = $filters->addOptionControl( [
            'type'  => 'textfield',
            'name'  => 'Organization ID',
            'slug'  => 'organization_id',
            'value' => '',
        ] );
        $ctrl->rebuildElementOnChange();

        $ctrl = $filters->addOptionControl( [
            'type'  => 'textfield',
            'name'  => 'Status  (available / checked_out / in_repair / retired / lost)',
            'slug'  => 'status',
            'value' => '',
        ] );
        $ctrl->rebuildElementOnChange();

        $ctrl = $filters->addOptionControl( [
            'type'  => 'textfield',
            'name'  => 'Category ID',
            'slug'  => 'category_id',
            'value' => '',
        ] );
        $ctrl->rebuildElementOnChange();

        $ctrl = $filters->addOptionControl( [
            'type'  => 'textfield',
            'name'  => 'Per Page',
            'slug'  => 'per_page',
            'value' => '50',
        ] );
        $ctrl->rebuildElementOnChange();

        $ctrl = $filters->addOptionControl( [
            'type'  => 'textfield',
            'name'  => 'Show Filters Bar  (yes / no)',
            'slug'  => 'show_filters',
            'value' => 'yes',
        ] );
        $ctrl->rebuildElementOnChange();

        $appearance = $this->addControlSection( 'appearance', 'Appearance', 'assets/icon.svg', $this );

        $ctrl = $appearance->addOptionControl( [
            'type'  => 'textfield',
            'name'  => 'Font Size (e.g. 14px)',
            'slug'  => 'font_size',
            'value' => '',
        ] );
        $ctrl->rebuildElementOnChange();
    }

    public function render( $options, $defaults, $content ): void {
        $sc = hugo_inv_oxy_build_sc( 'hugo_inv_assets', [
            'organization_id' => $options['organization_id'] ?? '',
            'status'          => $options['status']          ?? '',
            'category_id'     => $options['category_id']     ?? '',
            'per_page'        => $options['per_page']        ?? '50',
            'show_filters'    => $options['show_filters']    ?? 'yes',
            'font_size'       => $options['font_size']       ?? '',
        ] );
        // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
        echo do_shortcode( $sc );
    }
}
