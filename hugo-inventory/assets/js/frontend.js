/* Hugo Inventory — Frontend JS */
(function($) {
    'use strict';

    if (typeof hugoInvFE === 'undefined') return;

    var api  = hugoInvFE.restUrl;
    var rest = hugoInvFE.nonce;
    var i18n = hugoInvFE.i18n;

    // ── Lookup shortcode ───────────────────────────────────────────

    function initLookup() {
        $('.hugo-inv-fe-lookup').each(function() {
            var $wrap   = $(this);
            var $input  = $wrap.find('.hugo-inv-fe-lookup-input');
            var $btn    = $wrap.find('.hugo-inv-fe-lookup-btn');
            var $result = $wrap.find('.hugo-inv-fe-lookup-result');

            function doLookup() {
                var val = $.trim($input.val());
                if (val.length < 2) return;

                $result.removeClass('found not-found').html('<em>' + esc(i18n.searching) + '</em>').show();

                $.ajax({
                    url: api + 'assets/lookup',
                    data: { barcode: val },
                    beforeSend: function(xhr) { xhr.setRequestHeader('X-WP-Nonce', rest); },
                    success: function(data) {
                        if (data.found) {
                            var a = data.asset;
                            $result.addClass('found').html(
                                '<div class="hugo-inv-fe-result-header">' +
                                    '<h4>' + esc(a.name) + '</h4>' +
                                    '<code>' + esc(a.asset_tag) + '</code>' +
                                    statusBadge(a.status) +
                                '</div>' +
                                '<dl class="hugo-inv-fe-lookup-detail">' +
                                    detailRow('Organization', a.organization_name) +
                                    detailRow('Location', a.location_name) +
                                    detailRow('Category', a.category_name) +
                                    detailRow('Serial', a.serial_number) +
                                    detailRow('Assigned To', a.assigned_user_display) +
                                    detailRow('Purchase Date', a.purchase_date) +
                                    detailRow('Warranty Exp.', a.warranty_expiration) +
                                '</dl>'
                            );
                        } else {
                            $result.addClass('not-found').html(
                                '<strong>' + esc(i18n.notFound) + ':</strong> ' + esc(data.scanned_value)
                            );
                        }
                    },
                    error: function() {
                        $result.addClass('not-found').html(esc(i18n.error));
                    }
                });
            }

            $btn.on('click', doLookup);
            $input.on('keydown', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); doLookup(); }
            });
        });
    }

    // ── Assets table filter + count ────────────────────────────────

    function initAssetsFilter() {
        $('.hugo-inv-fe-assets').each(function() {
            var $wrap    = $(this);
            var $search  = $wrap.find('.hugo-inv-fe-assets-search');
            var $status  = $wrap.find('.hugo-inv-fe-assets-status');
            var $countEl = $wrap.find('.hugo-inv-fe-assets-count-visible');

            function filter() {
                var q = $.trim($search.val()).toLowerCase();
                var s = $status.val();
                var visible = 0;
                $wrap.find('.hugo-inv-fe-assets-table tbody tr').each(function() {
                    var $row = $(this);
                    var matchQ = !q || ($row.data('search') || '').toString().indexOf(q) !== -1;
                    var matchS = !s || $row.data('status') === s;
                    var show   = matchQ && matchS;
                    $row.toggle(show);
                    if (show) visible++;
                });
                if ($countEl.length) $countEl.text(visible.toLocaleString());
            }

            $search.on('keyup', filter);
            $status.on('change', filter);
        });
    }

    // ── Assets table column sort ───────────────────────────────────

    function initAssetsSort() {
        $(document).on('click', '.hugo-inv-fe-assets-table .hugo-inv-fe-sortable', function() {
            var $th    = $(this);
            var $table = $th.closest('table');
            var $tbody = $table.find('tbody');
            var col    = $th.data('col');

            // Determine direction: flip if already sorted this col ASC, else default ASC.
            var currentDir = $th.data('sort-dir') || '';
            var dir = (currentDir === 'asc') ? 'desc' : 'asc';

            // Clear all other headers.
            $table.find('.hugo-inv-fe-sortable').not($th)
                .removeData('sort-dir')
                .removeClass('sorted-asc sorted-desc');

            $th.data('sort-dir', dir).removeClass('sorted-asc sorted-desc').addClass('sorted-' + dir);

            // Collect and sort visible + hidden rows separately (keep empty row in place).
            var $rows = $tbody.find('tr').not('.hugo-inv-fe-empty-row');
            var rows  = $rows.toArray();

            rows.sort(function(a, b) {
                var aVal = ($(a).data(col) || '').toString();
                var bVal = ($(b).data(col) || '').toString();
                // Numeric sort if both look like numbers.
                var aNum = parseFloat(aVal);
                var bNum = parseFloat(bVal);
                var cmp;
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    cmp = aNum - bNum;
                } else {
                    cmp = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
                }
                return dir === 'asc' ? cmp : -cmp;
            });

            $.each(rows, function(i, row) {
                $tbody.append(row);
            });
        });
    }

    // ── Checkout / Check-in tabs + forms ───────────────────────────

    function initCheckout() {
        // Tab switching.
        $('.hugo-inv-fe-checkout-tabs').on('click', '.hugo-inv-fe-tab', function() {
            var $tab = $(this);
            var target = $tab.data('tab');
            $tab.addClass('active').siblings().removeClass('active');
            $tab.closest('.hugo-inv-fe-checkout')
                .find('.hugo-inv-fe-tab-content').removeClass('active')
                .filter('#hugo-inv-fe-tab-' + target).addClass('active');
        });

        // Asset lookup on scan fields.
        $('.hugo-inv-fe-checkout').find('.hugo-inv-fe-scan-field').each(function() {
            var $input   = $(this);
            var $hidden  = $input.closest('.hugo-inv-fe-field').find('input[name="asset_id"]');
            var $preview = $input.closest('.hugo-inv-fe-field').find('.hugo-inv-fe-asset-preview');
            var timer;

            $input.on('keyup', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); return; }
                clearTimeout(timer);
                var val = $.trim($input.val());
                if (val.length < 3) { $preview.hide(); $hidden.val(''); return; }

                timer = setTimeout(function() {
                    $.ajax({
                        url: api + 'assets/lookup',
                        data: { barcode: val },
                        beforeSend: function(xhr) { xhr.setRequestHeader('X-WP-Nonce', rest); },
                        success: function(data) {
                            if (data.found) {
                                var a = data.asset;
                                $hidden.val(a.id);
                                $preview.removeClass('error').html(
                                    '<strong>' + esc(a.name) + '</strong> ' +
                                    '<code>' + esc(a.asset_tag) + '</code> — ' +
                                    statusBadge(a.status)
                                ).show();
                            } else {
                                $hidden.val('');
                                $preview.addClass('error').html(esc(i18n.notFound) + ': ' + esc(val)).show();
                            }
                        }
                    });
                }, 400);
            });
        });

        // Checkout submit.
        $('#hugo-inv-fe-checkout-form').on('submit', function(e) {
            e.preventDefault();
            var $form = $(this);
            var $msg  = $form.find('.hugo-inv-fe-message');
            var $btn  = $form.find('button[type="submit"]');

            var assetId = $form.find('input[name="asset_id"]').val();
            if (!assetId) { showMsg($msg, i18n.error, 'error'); return; }

            $btn.prop('disabled', true);

            $.post(hugoInvFE.ajaxUrl, {
                action: 'hugo_inv_fe_checkout',
                _hugo_inv_fe_nonce: $form.find('input[name="_hugo_inv_fe_nonce"]').val(),
                asset_id: assetId,
                expected_return_date: $form.find('input[name="expected_return_date"]').val(),
                checkout_notes: $form.find('textarea[name="checkout_notes"]').val()
            }, function(resp) {
                $btn.prop('disabled', false);
                if (resp.success) {
                    showMsg($msg, resp.data.message, 'success');
                    $form[0].reset();
                    $form.find('.hugo-inv-fe-asset-preview').hide();
                } else {
                    showMsg($msg, resp.data.message || i18n.error, 'error');
                }
            }).fail(function() {
                $btn.prop('disabled', false);
                showMsg($msg, i18n.error, 'error');
            });
        });

        // Check-in submit.
        $('#hugo-inv-fe-checkin-form').on('submit', function(e) {
            e.preventDefault();
            var $form = $(this);
            var $msg  = $form.find('.hugo-inv-fe-message');
            var $btn  = $form.find('button[type="submit"]');

            var assetId = $form.find('input[name="asset_id"]').val();
            if (!assetId) { showMsg($msg, i18n.error, 'error'); return; }

            $btn.prop('disabled', true);

            $.post(hugoInvFE.ajaxUrl, {
                action: 'hugo_inv_fe_checkin',
                _hugo_inv_fe_nonce2: $form.find('input[name="_hugo_inv_fe_nonce2"]').val(),
                asset_id: assetId,
                checkin_notes: $form.find('textarea[name="checkin_notes"]').val()
            }, function(resp) {
                $btn.prop('disabled', false);
                if (resp.success) {
                    showMsg($msg, resp.data.message, 'success');
                    $form[0].reset();
                    $form.find('.hugo-inv-fe-asset-preview').hide();
                } else {
                    showMsg($msg, resp.data.message || i18n.error, 'error');
                }
            }).fail(function() {
                $btn.prop('disabled', false);
                showMsg($msg, i18n.error, 'error');
            });
        });
    }

    // ── Add Asset modal ──────────────────────────────────────────────

    function initAddAssetModal() {
        var $modal = $('#hugo-inv-add-asset-modal');
        if (!$modal.length) return;

        var $form      = $('#hugo-inv-add-asset-form');
        var $msg       = $modal.find('.hugo-inv-fe-message');
        var $submitBtn = $modal.find('.hugo-inv-fe-modal-submit');
        var $orgSel    = $modal.find('[name="organization_id"]');
        var $catSel    = $modal.find('[name="category_id"]');
        var $locSel    = $modal.find('[name="location_id"]');
        var $activeTable = null;

        // Populate a <select> from a REST endpoint.
        function populateSelect($sel, endpoint, placeholder) {
            $.ajax({
                url: api + endpoint,
                data: { per_page: 200, order: 'ASC', orderby: 'name' },
                beforeSend: function(xhr) { xhr.setRequestHeader('X-WP-Nonce', rest); },
                success: function(data) {
                    $sel.empty().append('<option value="">' + esc(placeholder) + '</option>');
                    $.each(data, function(i, item) {
                        $sel.append('<option value="' + parseInt(item.id, 10) + '">' + esc(item.name) + '</option>');
                    });
                }
            });
        }

        populateSelect($orgSel, 'organizations', '\u2014 Select Organization \u2014');
        populateSelect($catSel, 'categories',    '\u2014 None \u2014');
        populateSelect($locSel, 'locations',     '\u2014 None \u2014');

        function openModal($trigger) {
            $activeTable = $trigger.closest('.hugo-inv-fe-assets');
            $modal.css('display', 'flex');
            $modal.find('[name="name"]').trigger('focus');
            $('body').addClass('hugo-inv-fe-modal-open');
        }

        function closeModal() {
            $modal.hide();
            $form[0].reset();
            $msg.hide().removeClass('success error');
            $submitBtn.prop('disabled', false);
            $('body').removeClass('hugo-inv-fe-modal-open');
        }

        // Open modal.
        $(document).on('click', '.hugo-inv-fe-open-add-modal', function() {
            openModal($(this));
        });

        // Close modal.
        $modal.on('click', '.hugo-inv-fe-modal-close, .hugo-inv-fe-modal-cancel', closeModal);
        $modal.on('click', function(e) {
            if ($(e.target).is($modal)) closeModal();
        });
        $(document).on('keydown.hugoInvModal', function(e) {
            if (e.key === 'Escape' && $modal.is(':visible')) closeModal();
        });

        // Submit form.
        $form.on('submit', function(e) {
            e.preventDefault();

            var name  = $.trim($form.find('[name="name"]').val());
            var orgId = parseInt($form.find('[name="organization_id"]').val(), 10) || 0;

            if (!name)  { showMsg($msg, 'Asset name is required.', 'error');       return; }
            if (!orgId) { showMsg($msg, 'Please select an organization.', 'error'); return; }

            var payload = { name: name, organization_id: orgId };

            var status = $form.find('[name="status"]').val();
            if (status) payload.status = status;

            var tag = $.trim($form.find('[name="asset_tag"]').val());
            if (tag) payload.asset_tag = tag;

            var serial = $.trim($form.find('[name="serial_number"]').val());
            if (serial) payload.serial_number = serial;

            var catId = parseInt($form.find('[name="category_id"]').val(), 10);
            if (catId) payload.category_id = catId;

            var locId = parseInt($form.find('[name="location_id"]').val(), 10);
            if (locId) payload.location_id = locId;

            var pDate = $form.find('[name="purchase_date"]').val();
            if (pDate) payload.purchase_date = pDate;

            var pCost = parseFloat($form.find('[name="purchase_cost"]').val());
            if (!isNaN(pCost) && pCost >= 0) payload.purchase_cost = pCost;

            var warranty = $form.find('[name="warranty_expiration"]').val();
            if (warranty) payload.warranty_expiration = warranty;

            var desc = $.trim($form.find('[name="description"]').val());
            if (desc) payload.description = desc;

            $submitBtn.prop('disabled', true);
            $msg.hide();

            $.ajax({
                url: api + 'assets',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(payload),
                beforeSend: function(xhr) { xhr.setRequestHeader('X-WP-Nonce', rest); },
                success: function(asset) {
                    // Inject the new row into the assets table that triggered the modal.
                    if ($activeTable && $activeTable.length) {
                        var $tbody = $activeTable.find('.hugo-inv-fe-assets-table tbody');

                        // Remove the "no assets" empty row if present.
                        $tbody.find('tr:has(.hugo-inv-fe-empty)').remove();

                        var sc = { available: '#46b450', checked_out: '#0073aa', in_repair: '#ffb900', retired: '#826eb4', lost: '#dc3232' };
                        var bg     = sc[asset.status] || '#666';
                        var fgRule = asset.status === 'in_repair' ? ';color:#23282d' : '';
                        var orgN   = esc(asset.organization_name || '\u2014');
                        var locN   = esc(asset.location_name || '\u2014');
                        var sLabel = esc((asset.status || '').replace(/_/g, ' '));
                        sLabel = sLabel.charAt(0).toUpperCase() + sLabel.slice(1);

                        var $row = $('<tr>')
                            .attr('data-status',       asset.status)
                            .attr('data-search',       (asset.asset_tag + ' ' + asset.name + ' ' + (asset.organization_name || '') + ' ' + (asset.location_name || '') + ' ' + (asset.serial_number || '')).toLowerCase())
                            .attr('data-asset_tag',    (asset.asset_tag || '').toLowerCase())
                            .attr('data-name',         (asset.name || '').toLowerCase())
                            .attr('data-organization', (asset.organization_name || '').toLowerCase())
                            .attr('data-location',     (asset.location_name || '').toLowerCase())
                            .attr('data-status-val',   asset.status)
                            .html(
                                '<td><code>' + esc(asset.asset_tag) + '</code></td>' +
                                '<td>' + esc(asset.name) + '</td>' +
                                '<td>' + orgN + '</td>' +
                                '<td>' + locN + '</td>' +
                                '<td><span class="hugo-inv-fe-status" style="background:' + bg + fgRule + '">' + sLabel + '</span></td>'
                            );

                        $tbody.prepend($row);

                        // Increment the visible count display.
                        var $countEl = $activeTable.find('.hugo-inv-fe-assets-count-visible');
                        if ($countEl.length) {
                            var cur = parseInt(($countEl.text() || '0').replace(/\D/g, ''), 10) || 0;
                            $countEl.text((cur + 1).toLocaleString());
                        }
                    }

                    closeModal();
                },
                error: function(xhr) {
                    var errMsg = (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : i18n.error;
                    showMsg($msg, errMsg, 'error');
                    $submitBtn.prop('disabled', false);
                }
            });
        });
    }

    // ── Helpers ─────────────────────────────────────────────────────

    var statusColors = {
        available: '#46b450', checked_out: '#0073aa', in_repair: '#ffb900',
        retired: '#826eb4', lost: '#dc3232'
    };

    function statusBadge(status) {
        if (!status) return '';
        var bg = statusColors[status] || '#666';
        var fg = status === 'in_repair' ? '#23282d' : '#fff';
        return '<span class="hugo-inv-fe-status" style="background:' + bg + ';color:' + fg + ';">' +
               esc(status.replace(/_/g, ' ')) + '</span>';
    }

    function detailRow(label, value) {
        if (!value) return '';
        return '<dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd>';
    }

    function esc(str) {
        if (!str) return '';
        return $('<span>').text(str).html();
    }

    function showMsg($el, text, type) {
        $el.removeClass('success error').addClass(type).text(text).show();
    }

    // ── Boot ───────────────────────────────────────────────────────

    $(document).ready(function() {
        initLookup();
        initAssetsFilter();
        initAssetsSort();
        initCheckout();
        initAddAssetModal();
    });

})(jQuery);
