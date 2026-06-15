
// Global variables
let selectedNotificationId = null;
const notificationToastStorageKeyPrefix = 'personelTakipShownNotificationToasts';
const notificationToastVisibleIds = new Set();

$(document).ready(function () {
    // Check URL for selectedId
    const urlParams = new URLSearchParams(window.location.search);
    const paramId = urlParams.get('selectedId');

    if ($('#notification-list').length) {
        if (paramId) {
            selectedNotificationId = paramId;
        }

        loadInbox();

        // Search input listener
        $('#search-input').on('keyup', function () {
            var value = $(this).val().toLocaleLowerCase('tr-TR');
            $("#notification-list .list-group-item").each(function () {
                var text = $(this).text().toLocaleLowerCase('tr-TR');
                // d-flex overrides display:none, so we must use d-none class or remove d-flex
                var isMatch = text.indexOf(value) > -1;
                $(this).toggleClass('d-none', !isMatch);
            });
        });
    }
});

function loadInbox() {
    // 1. STATE: LOADING
    // Always render loading on left
    $('#notification-list').html(document.getElementById('loading-left-template').innerHTML);

    // Render loading on right ONLY if we don't have a content to show (e.g. refreshing) OR if we want to blocking-load
    // For smoother UX, if we already have a selection, maybe we don't wipe right panel?
    // User requested strict Loading state -> "Loading UI (sol + sağ)" when isLoading=true.
    // So let's be strict.
    $('#notification-detail-container').html(document.getElementById('loading-right-template').innerHTML);

    $.ajax({
        url: '/Bildirimler/GetData',
        type: 'GET',
        data: { selectedId: selectedNotificationId },
        success: function (response) {

            // 2. STATE: EMPTY (Normal Success but 0 items)
            if (!response.inbox || response.inbox.length === 0) {
                $('#notification-list').html(document.getElementById('empty-left-template').innerHTML);
                $('#notification-detail-container').html(document.getElementById('empty-right-template').innerHTML);
                return; // Stop processing
            }

            // 3. STATE: NORMAL (Items exist)
            renderList(response.inbox);

            if (response.selectedNotification) {
                // Case: Item selected
                renderDetail(response.selectedNotification);
                // Scroll to item
                setTimeout(() => {
                    const item = document.getElementById(`notif-item-${response.selectedNotification.bildirimId}`);
                    if (item) item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            } else {
                // Case: No item selected (Placeholder)
                // NOTE: User said "Bir bildirim seçin" must ONLY appear when there ARE notifications.
                // We are in the notifications.length > 0 block, so this is correct.
                $('#notification-detail-container').html(document.getElementById('select-notification-template').innerHTML);
            }
        },
        error: function () {
            // 4. STATE: ERROR
            console.error("Bildirimler yüklenemedi.");
            $('#notification-list').html(document.getElementById('error-left-template').innerHTML);
            $('#notification-detail-container').html(document.getElementById('error-right-template').innerHTML);
        }
    });
}

// --- ACTIONS ---
// --- ACTIONS ---
// Using window assignment to ensure global availability
window.deleteNotification = function (e, id) {
    // 1. Log entry immediately with Error level to bypass filters
    console.error("[DEBUG] deleteNotification ENTERED for ID:", id);

    try {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // 2. Check Swal
        if (typeof Swal === 'undefined') {
            console.error("[DEBUG] SweetAlert2 (Swal) is NOT defined!");
            alert("Hata: SweetAlert2 kütüphanesi yüklenemedi. Lütfen sayfayı yenileyiniz.");
            return;
        }

        // 3. Show Dialog
        Swal.fire({
            title: 'Emin misiniz?',
            text: "Bu bildirim kalıcı olarak silinecektir!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Evet, Sil!',
            cancelButtonText: 'Vazgeç'
        }).then((result) => {
            if (result.isConfirmed) {
                console.log("[DEBUG] User confirmed delete. Sending AJAX...");

                $.post('/Bildirimler/Delete', { id: id })
                    .done(function () {
                        console.log("[DEBUG] Delete AJAX Success:", id);

                        // UI updates
                        $(`#notif-item-${id}`).fadeOut(300, function () { $(this).remove(); });
                        $(`#dropdown-notif-${id}`).fadeOut(300, function () { $(this).remove(); });

                        if (typeof loadTopbarCount === 'function') loadTopbarCount();

                        // If selected was deleted, clear detail
                        if (typeof selectedNotificationId !== 'undefined' && selectedNotificationId == id) {
                            selectedNotificationId = null;
                            const url = new URL(window.location);
                            url.searchParams.delete('selectedId');
                            try {
                                window.history.pushState({}, '', url);
                            } catch (err) { console.log(err); }

                            // Try references safely
                            const emptyTemplate = document.getElementById('empty-right-template');
                            if (emptyTemplate) {
                                $('#notification-detail-container').html(emptyTemplate.innerHTML);
                            }
                        }

                        Swal.fire({
                            position: 'top-end',
                            icon: 'success',
                            title: 'Silindi',
                            showConfirmButton: false,
                            timer: 1500,
                            toast: true
                        });
                    })
                    .fail(function (xhr) {
                        console.error("[DEBUG] Delete AJAX Failed:", xhr);
                        Swal.fire('Hata', 'Silme işlemi başarısız: ' + (xhr.responseJSON?.message || xhr.statusText), 'error');
                    });
            } else {
                console.log("[DEBUG] Delete cancelled by user.");
            }
        });
    } catch (err) {
        console.error("[CRITICAL] Crash in deleteNotification:", err);
        alert("Beklenmeyen hata: " + err.message);
    }
};

window.markRead = function (e, id) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    console.log("[JS] markRead called for:", id);

    $.post('/Bildirimler/Read', { id: id })
        .done(function () {
            // UI updates
            $(`#notif-item-${id}`).removeClass('unread').addClass('read');
            $(`#notif-item-${id} .unread-indicator`).addClass('d-none');
            $(`#dropdown-notif-${id}`).removeClass('bg-light');
            if (typeof loadTopbarCount === 'function') loadTopbarCount();
        })
        .fail(function (xhr) {
            console.error("[JS] MarkRead failed:", xhr);
        });
};

// --- EVENT DELEGATION (ROBUST) ---
$(document).on('click', '.btn-mark-read', function (e) {
    e.preventDefault();
    e.stopPropagation();
    const id = $(this).data('id');
    console.log("[DELEGATION] MarkRead clicked for:", id);
    if (id) markRead(null, id);
});

$(document).on('click', '.btn-delete-notif', function (e) {
    e.preventDefault();
    e.stopPropagation();
    const id = $(this).data('id');
    console.log("[DELEGATION] Delete clicked for:", id);
    if (id) deleteNotification(null, id);
});

function renderList(inbox) {
    const container = $('#notification-list');
    container.empty();
    const template = document.getElementById('notification-item-template').innerHTML;

    inbox.forEach(function (n) {
        const initials = getInitials(n.gonderenAdSoyad);
        const dateStr = formatDate(n.olusturmaTarihi);
        let unreadClass = n.okunduMu ? 'd-none' : '';
        let bgClass = n.okunduMu ? 'read' : 'unread';
        if (typeof selectedNotificationId !== 'undefined' && selectedNotificationId == n.bildirimId) {
            bgClass += ' active-item';
            unreadClass = 'd-none';
        }

        // Direct Action Buttons (No Dropdown, No Inline Onclick)
        let actions = `
            <div class="notification-actions" style="position:absolute; top:15px; right:10px; z-index:100; display:flex; gap:5px;">
                <button type="button" class="btn btn-sm btn-icon btn-outline-primary rounded-pill btn-mark-read" 
                        data-id="${n.bildirimId}" 
                        title="Okundu İşaretle" data-bs-toggle="tooltip">
                    <i class="bx bx-envelope-open"></i>
                </button>
                <button type="button" class="btn btn-sm btn-icon btn-outline-danger rounded-pill btn-delete-notif" 
                        data-id="${n.bildirimId}" 
                        title="Kalıcı Sil" data-bs-toggle="tooltip">
                    <i class="bx bx-trash"></i>
                </button>
            </div>
        `;

        let html = template
            .replace(/{id}/g, n.bildirimId)
            .replace('{initials}', initials)
            .replace('{sender}', `${n.gonderenAdSoyad} <span class="fw-normal text-muted" style="font-size:0.8em">(${n.gonderenKurumsalRolOzet})</span>`)
            .replace('{date}', dateStr)
            .replace('{title}', n.baslik)
            .replace('{desc}', n.aciklama)
            .replace('{unreadClass}', unreadClass);

        const $el = $(html);
        $el.addClass(bgClass);
        $el.addClass('position-relative');
        $el.css('padding-right', '80px'); // Make space for buttons so text doesn't overlap
        $el.append(actions);
        $el.attr('id', `notif-item-${n.bildirimId}`);

        container.append($el);
    });

    // Initialize tooltips for new elements
    $('[data-bs-toggle="tooltip"]').tooltip();
}

function renderDetail(n) {
    const container = $('#notification-detail-container');
    const template = document.getElementById('notification-detail-template').innerHTML;

    const initials = getInitials(n.gonderenAdSoyad);
    const dateStr = new Date(n.olusturmaTarihi).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const linkClass = n.url ? '' : 'd-none';

    let html = template
        .replace('{initials}', initials)
        .replace('{sender}', n.gonderenAdSoyad)
        .replace('{role}', n.gonderenKurumsalRolOzet)
        .replace('{fullDate}', dateStr)
        .replace('{title}', n.baslik)
        .replace('{body}', n.aciklama)
        .replace('{link}', n.url || '#')
        .replace('{linkClass}', linkClass);

    container.html(html);
}

function selectNotification(el, id) {
    // UI Update
    $('.list-group-item').removeClass('active-item');
    $(el).addClass('active-item');
    $(el).find('.unread-indicator').addClass('d-none'); // Hide dot
    $(el).removeClass('unread').addClass('read');

    selectedNotificationId = id;

    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('selectedId', id);
    window.history.pushState({}, '', url);

    // Fetch Detail
    $.ajax({
        url: '/Bildirimler/GetData',
        data: { selectedId: id },
        success: function (response) {
            if (response.selectedNotification) {
                renderDetail(response.selectedNotification);
                loadTopbarCount(); // Refresh badge
            }
        }
    });
}

// Helpers
function getInitials(name) {
    if (!name) return "S";
    var parts = name.split(' ');
    var initials = parts[0].substring(0, 1).toUpperCase();
    if (parts.length > 1) {
        initials += parts[parts.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
}

function formatDate(dateString) {
    const d = new Date(dateString);
    const now = new Date();
    const diff = now - d;

    // If today: HH:mm
    if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getShownNotificationToastIds() {
    try {
        const storedValue = localStorage.getItem(getNotificationToastStorageKey());
        const parsedValue = storedValue ? JSON.parse(storedValue) : [];
        return Array.isArray(parsedValue) ? parsedValue.map(String) : [];
    } catch (err) {
        console.warn('Bildirim toast kayıtları okunamadı.', err);
        return [];
    }
}

function rememberNotificationToastShown(id) {
    const normalizedId = String(id);
    const shownIds = new Set(getShownNotificationToastIds());
    shownIds.add(normalizedId);

    try {
        localStorage.setItem(getNotificationToastStorageKey(), JSON.stringify(Array.from(shownIds)));
    } catch (err) {
        console.warn('Bildirim toast kaydı tutulamadı.', err);
    }
}

function getNotificationToastStorageKey() {
    const userId = window.personelTakipCurrentUserId || 'anonymous';
    return `${notificationToastStorageKeyPrefix}:${userId}`;
}

function ensureNotificationToastStack() {
    let stack = $('#notificationToastStack');
    if (!stack.length) {
        stack = $('<div id="notificationToastStack" class="notification-toast-stack" aria-live="polite" aria-atomic="false"></div>');
        $('body').append(stack);
    }
    return stack;
}

function getNotificationToastAvatar(n) {
    if (n.gonderenFotoUrl) {
        return `<img src="${escapeHtml(n.gonderenFotoUrl)}" alt="">`;
    }

    return escapeHtml(getInitials(n.gonderenAdSoyad));
}

function openNotificationFromToast(id) {
    markRead(null, id);
    window.location.href = `/Bildirimler/Index?selectedId=${id}`;
}

function closeNotificationToast(id) {
    $(`#notification-toast-${id}`).fadeOut(160, function () {
        $(this).remove();
        notificationToastVisibleIds.delete(String(id));
    });
}

function showNotificationToasts(list) {
    if (!Array.isArray(list) || !list.length || !$('#notificationBadge').length) return;

    const shownIds = new Set(getShownNotificationToastIds());
    const stack = ensureNotificationToastStack();

    list
        .filter(n => n && !n.okunduMu && !shownIds.has(String(n.bildirimId)) && !notificationToastVisibleIds.has(String(n.bildirimId)))
        .forEach(n => {
            const id = String(n.bildirimId);
            notificationToastVisibleIds.add(id);
            rememberNotificationToastShown(id);

            const toast = $(`
                <div class="notification-toast-card" id="notification-toast-${escapeHtml(id)}" role="button" tabindex="0">
                    <div class="notification-toast-avatar">${getNotificationToastAvatar(n)}</div>
                    <div class="notification-toast-body">
                        <div class="notification-toast-sender text-truncate">${escapeHtml(n.gonderenAdSoyad || 'Sistem')}</div>
                        <div class="notification-toast-title">${escapeHtml(n.baslik)}</div>
                    </div>
                    <button type="button" class="notification-toast-close" aria-label="Bildirimi kapat">
                        <i class="bx bx-x"></i>
                    </button>
                </div>
            `);

            toast.on('click', function (e) {
                if ($(e.target).closest('.notification-toast-close').length) return;
                openNotificationFromToast(id);
            });

            toast.on('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openNotificationFromToast(id);
                }
            });

            toast.find('.notification-toast-close').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                closeNotificationToast(id);
            });

            stack.append(toast.hide().fadeIn(160));
        });
}

// Topbar Logic (Global)
function loadTopbarCount() {
    $.get('/Bildirimler/Topbar', function (data) {
        const badge = $('#notificationBadge');
        if (data.count > 0) {
            badge.removeClass('bg-secondary').addClass('bg-danger');
            badge.text(data.count > 99 ? '99+' : data.count).show();
        } else {
            // User requested: 0 count, gray background, text '0'
            badge.removeClass('bg-danger').addClass('bg-secondary');
            badge.text('0').show();
        }
        renderDropdown(data.top);
        showNotificationToasts(data.top);
    }).fail(function () {
        console.error("Bildirimler/Topbar failed.");
        const badge = $('#notificationBadge');
        badge.removeClass('bg-danger').addClass('bg-secondary');
        badge.text('0').show();
    });
}

function renderDropdown(list) {
    const container = $('#notificationList');
    if (!container.length) return;

    container.empty();
    if (list.length === 0) {
        container.html('<li class="list-group-item text-center small text-muted">Yeni bildirim yok</li>');
        return;
    }

    list.forEach(n => {
        const bg = n.okunduMu ? '' : 'bg-light';

        // Using BUTTON for actions to avoid anchor nesting issues
        const html = `
             <li class="list-group-item list-group-item-action dropdown-notifications-item ${bg}" id="dropdown-notif-${n.bildirimId}" onclick="window.location.href='/Bildirimler/Index?selectedId=${n.bildirimId}'" style="cursor:pointer">
                <div class="d-flex align-items-center">
                  <div class="flex-shrink-0 me-3">
                    <div class="avatar">
                      <span class="avatar-initial rounded-circle bg-label-primary">${getInitials(n.gonderenAdSoyad)}</span>
                    </div>
                  </div>
                  <div class="flex-grow-1">
                    <h6 class="mb-1 text-truncate" style="max-width:200px;">${n.baslik}</h6>
                    <small class="text-muted">${n.gonderenAdSoyad}</small>
                    <small class="text-muted d-block" style="font-size:0.7em">${formatDate(n.olusturmaTarihi)}</small>
                  </div>
                  <div class="flex-shrink-0 dropdown-notifications-actions">
                    <button type="button" class="btn btn-icon btn-sm btn-text-secondary rounded-pill" onclick="markRead(event, ${n.bildirimId})" title="Okundu İşaretle"><span class="badge badge-dot bg-primary"></span></button>
                    <button type="button" class="btn btn-icon btn-sm btn-text-danger rounded-pill" onclick="deleteNotification(event, ${n.bildirimId})" title="Sil"><span class="bx bx-x"></span></button>
                  </div>
                </div>
              </li>
        `;
        container.append(html);
    });
}

function markAllRead() {
    $.post('/Bildirimler/MarkAllRead', function () {
        loadTopbarCount();
        if (typeof loadInbox === 'function') loadInbox();
    });
}

// Init topbar
$(function () {
    loadTopbarCount();
    // Optional: Poll every 30s
    setInterval(loadTopbarCount, 30000);
});
