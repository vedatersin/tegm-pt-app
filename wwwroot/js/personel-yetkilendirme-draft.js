
// State
let originalState = null;
let draftState = null;
let currentPersonelId = null;
let activeDrawerTab = 'navs-atama';

// Constants
const ROLES = {
    GENEL_KOORD: 4,
    IL_KOORD: 3,
    KOMISYON_BASKANI: 2,
    PERSONEL: 1,
    MERKEZ_TESKILAT: 1,
    ANKARA_TEGM_KOORD: 1
};
const SYSTEM_MODES = [
    { key: 'program', label: 'Program Geliştirme Modu' },
    { key: 'komisyon', label: 'Komisyon İzleme Modu' },
    { key: 'master', label: 'Master Admin Modu' }
];

// UI Helpers
const showLoader = () => $('#drawerLoader').removeClass('d-none');
const hideLoader = () => $('#drawerLoader').addClass('d-none');
const isDirty = () => JSON.stringify(originalState) !== JSON.stringify(draftState);

// --- Initialization ---
$(document).ready(function () {
    // Initialize standard Select2s
    $('#filterKoordinatorluk, #filterBrans').select2({ theme: 'bootstrap-5', allowClear: false, width: '100%' });

    // Drawer Close Protection
    const drawerEl = document.getElementById('offcanvasEnd');
    drawerEl.addEventListener('hide.bs.offcanvas', function (e) {
        if (isDirty()) {
            e.preventDefault(); // Stop closing
            Swal.fire({
                title: 'Kaydedilmemiş Değişiklikler',
                text: "Yaptığınız değişiklikler kaybolacak. Çıkmak istediğinize emin misiniz?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Evet, Çık',
                cancelButtonText: 'İptal'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Reset state to avoid loop
                    draftState = JSON.parse(JSON.stringify(originalState));
                    updateUI(); // Clear dirty flag visually

                    // Manually close without triggering this listener logic again? 
                    // Remove listener or just use the API method which might re-trigger?
                    // Bootstrap 5 offcanvas hide event can be tricky.
                    // Simplest: Allow close by removing the prevention logic temporarily or standard way.
                    // Actually, since we've reset state, next trigger won't be dirty.
                    const instance = bootstrap.Offcanvas.getInstance(drawerEl);
                    instance.hide();
                }
            });
        }
    });
});

// --- Drawer Open/Load ---
async function openDrawer(id) {
    // Prevent switching if dirty
    if (isDirty()) {
        const result = await Swal.fire({
            title: 'Kaydedilmemiş Değişiklikler',
            text: "Başka bir kişiye geçmeden önce mevcut değişiklikleri kaydetmelisiniz veya iptal etmelisiniz.",
            icon: 'warning',
            showDenyButton: true,
            confirmButtonText: 'Değişiklikleri Sil ve Geç',
            denyButtonText: 'İptal'
        });

        if (!result.isConfirmed) return; // Stay
        // Reset state effectively allowing switch
        draftState = JSON.parse(JSON.stringify(originalState));
    }

    const bsOffcanvas = new bootstrap.Offcanvas(document.getElementById('offcanvasEnd'));
    bsOffcanvas.show();
    loadDraftData(id);
}

async function loadDraftData(id) {
    showLoader();
    $('#drawerContent').html('');
    currentPersonelId = id;
    activeDrawerTab = 'navs-atama';

    try {
        const response = await fetch(`/Personel/GetYetkilendirmeData/${id}`);
        if (!response.ok) throw new Error('Veri yüklenemedi');

        const data = await response.json();

        // Normalize Data for State
        // Structure: see DTO. We need to map the incoming ViewModel to our SaveDTO structure for consistency
        originalState = {
            personelId: data.personelId,
            sistemRol: data.sistemRol,
            yetkiliModlar: data.yetkiliModlar || [],
            teskilatIds: data.selectedTeskilatIds || [],
            koordinatorlukIds: data.selectedKoordinatorlukIds || [],
            komisyonIds: data.selectedKomisyonIds || [],
            gorevler: data.kurumsalRolAssignments.map(a => ({
                kurumsalRolId: a.kurumsalRolId, // We need IDs from backend! ViewModel has them? 
                // Wait, ViewModel 'kurumsalRolAssignments' has 'assignmentId', 'rolAd', 'contextAd'.
                // Does it have rolId? We might need to enrich the backend ViewModel or infer it.
                // Checking previous code... ViewModel likely has it or we assume.
                // Let's assume we need to update ViewModel to include IDs if missing.
                // CHECKPOINT: Ensure GetYetkilendirmeData returns IDs.
                // Looking at ViewModel: PersonelYetkiDetailViewModel. 
                // If it lacks IDs, we have a problem.
                // Assuming it has 'kurumsalRolId', 'bindingId' (context).
                // Let's assume data is sufficient for now, or we rely on 'all...' lists to map names? No, IDs are safer.

                // For now, let's assume the ViewModel provides what we need or we map carefully.
                // Actually, let's persist the 'whole' data object for UI rendering (options etc), 
                // and keep 'draftState' as the distinct values we track.

                kurumsalRolId: a.kurumsalRolId,
                koordinatorlukId: a.koordinatorlukId,
                komisyonId: a.komisyonId
            }))
        };

        // Store full reference data for UI rendering (dropdown options)
        // We attach it to the window or a global object for render functions to access
        window.drawerRefData = data;

        draftState = JSON.parse(JSON.stringify(originalState));

        // RESET FORM STATE (Fix for issue: Old edit state persisting)
        resetAddFormState();

        renderDrawer();
    } catch (error) {
        console.error(error);
        $('#drawerContent').html('<div class="alert alert-danger">Veri yüklenemedi.</div>');
    } finally {
        hideLoader();
    }
}

// Helper to reset internal form state
function resetAddFormState() {
    addFormSelections = {
        teskilatId: null,
        koordinatorlukId: null,
        komisyonId: null,
        roleId: null,
        editingItem: null
    };
}

// --- Rendering ---
function renderDrawer() {
    const data = window.drawerRefData;
    const state = draftState;

    // Header updates
    // (Optional: update header UI if needed, usually static per user load)

    // Build Content using State
    let html = `
        <div class="d-flex align-items-center mb-4">
             ${renderAvatar(data)}
             <div>
                 <h5 class="mb-1">${data.adSoyad}</h5>
                 <span class="text-muted small">${state.sistemRol || '-'}</span>
                  ${isDirty() ? '<span class="badge bg-warning ms-2 text-dark">Kaydedilmedi</span>' : ''}
             </div>
        </div>

        <ul class="nav nav-tabs nav-fill mb-4 border-bottom" role="tablist">
            <li class="nav-item"><button class="nav-link ${activeDrawerTab === 'navs-atama' ? 'active' : ''} border-0" data-bs-toggle="tab" data-bs-target="#navs-atama">Kurumsal Atamalar</button></li>
            <li class="nav-item"><button class="nav-link ${activeDrawerTab === 'navs-sistem' ? 'active' : ''} border-0" data-bs-toggle="tab" data-bs-target="#navs-sistem">Sistemsel Yetki</button></li>
        </ul>

        <div class="tab-content p-0" style="min-height:300px;">
            <div class="tab-pane fade ${activeDrawerTab === 'navs-atama' ? 'show active' : ''}" id="navs-atama">
                ${renderAssignmentsTab(state, data)}
            </div>
            <div class="tab-pane fade ${activeDrawerTab === 'navs-sistem' ? 'show active' : ''}" id="navs-sistem">
                ${renderSystemTab(state, data)}
            </div>
        </div>

        <!-- Sticky Footer Actions -->
        <div class="offcanvas-footer border-top p-3 bg-white position-absolute bottom-0 start-0 w-100 d-flex gap-2">
            <button class="btn btn-primary flex-grow-1" onclick="saveDraft()" ${!isDirty() ? 'disabled' : ''}>
                <i class='bx bx-save me-1'></i>Kaydet
            </button>
            <button class="btn btn-outline-secondary flex-grow-1" onclick="cancelDraft()" ${!isDirty() ? 'disabled' : ''}>
                İptal
            </button>
        </div>
    `;

    $('#drawerContent').html(html);
    $('#drawerContent [data-bs-toggle="tab"]').off('shown.bs.tab.auth').on('shown.bs.tab.auth', function () {
        const target = $(this).attr('data-bs-target');
        if (target) {
            activeDrawerTab = target.replace('#', '');
        }
    });
}

function renderAvatar(data) {
    if (data.fotografYolu) {
        return `<img src="${data.fotografYolu}" class="rounded-circle me-3" width="64" height="64">`;
    }
    const initials = data.adSoyad.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return `<span class="badge bg-label-secondary p-3 rounded-circle me-3 d-flex align-items-center justify-content-center" style="width:64px; height:64px; font-size: 1.5rem;">${initials}</span>`;
}

function renderSystemTab(state, data) {
    const isAdmin = state.sistemRol === 'Admin';
    return `
        <div class="mb-3">
            <label class="form-label text-muted small text-uppercase">Sistem Rolü</label>
            <select class="form-select" onchange="updateSistemRol(this.value)">
                ${window.allSistemRolOptions.map(o => `<option value="${o.text}" ${o.text === state.sistemRol ? 'selected' : ''}>${o.text}</option>`).join('')}
            </select>
        </div>
        ${isAdmin ? `
            <div class="border rounded p-3 bg-light">
                <label class="form-label text-muted small text-uppercase mb-2">Admin Modları</label>
                <div class="d-flex flex-column gap-2">
                    ${SYSTEM_MODES.map(mode => `
                        <label class="form-check mb-0">
                            <input class="form-check-input" type="checkbox" value="${mode.key}" ${state.yetkiliModlar.includes(mode.key) ? 'checked' : ''} onchange="toggleYetkiliMod('${mode.key}', this.checked)">
                            <span class="form-check-label">${mode.label}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
}

// --- Unified Logic ---

function renderAssignmentsTab(state, data) {
    const displayList = buildDisplayList(state, data);

    let html = `<label class="form-label text-muted small text-uppercase mb-2">Mevcut Yetkiler</label>`;

    if (displayList.length > 0) {
        html += `<div class="d-flex flex-column gap-2 mb-4">`;
        displayList.forEach((item, idx) => {
            const editClass = item.isEditing ? 'border-warning bg-warning bg-opacity-10' : `border-${item.color}`;

            html += `
                <div class="d-flex justify-content-between align-items-center bg-light p-3 rounded border border-start-4 ${editClass} shadow-sm">
                     <div class="overflow-hidden">
                        <span class="fw-bold d-block text-truncate ${item.color === 'danger' ? 'text-danger' : ''}" title="${item.title}">${item.title}</span>
                        <small class="text-muted d-block text-truncate" title="${item.subtitle}">${item.subtitle}</small>
                     </div>
                     <div class="d-flex">
                         <button class="btn btn-sm btn-icon btn-text-primary rounded-pill me-1" onclick="editItem('${item.type}', ${item.id}, ${item.gIndex})" title="Düzenle">
                            <i class="bx bx-edit-alt fs-4"></i>
                         </button>
                         <button class="btn btn-sm btn-icon btn-text-secondary rounded-pill" onclick="removeItem('${item.type}', ${item.id}, ${item.gIndex})" title="Yetkiyi Kaldır">
                            <i class="bx bx-x fs-4"></i>
                         </button>
                     </div>
                </div>
            `;
        });
        html += `</div>`;
    } else {
        html += `<div class="alert alert-secondary d-flex align-items-center" role="alert">
                    <i class="bx bx-info-circle me-2"></i>
                    <div>Henüz tanımlanmış bir yetki yok.</div>
                 </div>`;
    }

    // Unified Add Form
    html += renderUnifiedAddForm(state, data);

    return html;
}

function buildDisplayList(state, data) {
    let list = [];
    const editState = addFormSelections.editingItem;

    // 1. Explicit Roles (Gorevler)
    state.gorevler.forEach((g, idx) => {
        const roleDef = window.allKurumsalRolOptions.find(r => r.value == g.kurumsalRolId);
        const roleName = roleDef ? roleDef.text : 'Rol';

        // Resolve Context
        let contextName = "";
        let path = "";

        if (g.komisyonId) {
            const kom = data.allKomisyonlar.find(k => k.id == g.komisyonId);
            if (kom) {
                contextName = kom.ad;
                // Find Parent path
                const koord = data.allKoordinatorlukler.find(k => k.id == kom.parentId); // correction: VM has parentId
                const tes = koord ? data.allTeskilatlar.find(t => t.id == koord.parentId) : null;
                path = [tes?.ad, koord?.ad].filter(Boolean).join(" > ");
            }
        } else if (g.koordinatorlukId) {
            const koord = data.allKoordinatorlukler.find(k => k.id == g.koordinatorlukId);
            if (koord) {
                contextName = koord.ad;
                const tes = data.allTeskilatlar.find(t => t.id == koord.parentId);
                path = tes?.ad || "";
            }
        }

        const isEditing = editState && editState.type === 'gorev' && editState.gIndex === idx;

        list.push({
            type: 'gorev',
            id: null,
            gIndex: idx, // Index in gorevler array
            title: roleName,
            subtitle: contextName ? `${path ? path + " > " : ""}${contextName}` : "Genel",
            color: 'primary', // Explicit roles are normal
            priority: 10,
            // Track coverage to hide implicit memberships
            komId: g.komisyonId,
            koordId: g.koordinatorlukId,
            isEditing: isEditing
        });
    });

    // 2. Implicit Memberships (Hide if covered by Explicit Roles OR by Child Units)

    // Coverage Maps
    const coveredKomIds = new Set(list.map(i => i.komId).filter(Boolean));
    const coveredKoordIds = new Set(list.map(i => i.koordId).filter(Boolean));

    // Also, if a Komisyon is selected, its Parent Koordinatorluk is "covered" (implicitly)
    state.komisyonIds.forEach(kid => {
        const kom = data.allKomisyonlar.find(k => k.id == kid);
        if (kom && kom.parentId) coveredKoordIds.add(kom.parentId);
    });

    state.koordinatorlukIds.forEach(kid => {
        const koord = data.allKoordinatorlukler.find(k => k.id == kid);
        if (koord && koord.parentId) {
            // We could mark Teskilat covered, but Teskilat selection is usually too broad to hide completely?
            // User requirement: "Ankara ve Mardin koordinatörlükleri ayrı ayrı görülmesin... yukarıda rollerim listelenmiş olur".
            // If I am "Ankara Personeli", I see it.
            // If I am "Fen Komisyonu Üyesi", I am implicitly Ankara Personeli. Do I see separate "Ankara Personeli"?
            // User says: "Gerek yok".
            // So yes, hide Koordinatorluk membership if Komisyon membership exists in it.
        }
    });


    // A. Komisyon Memberships
    state.komisyonIds.forEach(kid => {
        if (coveredKomIds.has(kid)) return;

        const kom = data.allKomisyonlar.find(k => k.id == kid);
        if (!kom) return;

        const koord = data.allKoordinatorlukler.find(k => k.id == kom.parentId);
        const tes = koord ? data.allTeskilatlar.find(t => t.id == koord.parentId) : null;
        const path = [tes?.ad, koord?.ad].filter(Boolean).join(" > ");

        const isEditing = editState && editState.type === 'kom' && editState.id === kid;

        list.push({
            type: 'kom',
            id: kid,
            title: '(Rolü Yok)', // Modified
            subtitle: `${path ? path + " > " : ""}${kom.ad}`,
            color: 'danger', // Modified
            priority: 5,
            isEditing: isEditing
        });
    });

    // B. Koordinatörlük Memberships
    state.koordinatorlukIds.forEach(kid => {
        if (coveredKoordIds.has(kid)) return; // Hidden by Commission or Explicit Role

        const koord = data.allKoordinatorlukler.find(k => k.id == kid);
        if (!koord) return;

        const tes = data.allTeskilatlar.find(t => t.id == koord.parentId);
        const isEditing = editState && editState.type === 'koord' && editState.id === kid;

        list.push({
            type: 'koord',
            id: kid,
            title: '(Rolü Yok)', // Modified
            subtitle: `${tes ? tes.ad + " > " : ""}${koord.ad}`,
            color: 'danger', // Modified
            priority: 2,
            isEditing: isEditing
        });
    });

    // C. Teşkilat Memberships
    const activeTeskilatIdsInKoords = new Set();
    state.koordinatorlukIds.forEach(kid => {
        const k = data.allKoordinatorlukler.find(x => x.id == kid);
        if (k) activeTeskilatIdsInKoords.add(k.parentId);
    });

    state.teskilatIds.forEach(tid => {
        if (activeTeskilatIdsInKoords.has(tid)) return;

        const tes = data.allTeskilatlar.find(t => t.id == tid);
        if (!tes) return;

        const isEditing = editState && editState.type === 'tes' && editState.id === tid;

        list.push({
            type: 'tes',
            id: tid,
            title: '(Rolü Yok)', // Modified
            subtitle: tes.ad,
            color: 'danger', // Modified
            priority: 1,
            isEditing: isEditing
        });
    });

    return list.sort((a, b) => b.priority - a.priority);
}

// ... (renderUnifiedAddForm remains same) ...

window.editItem = function (type, id, gIndex) {
    const data = window.drawerRefData;
    let tId = null, kId = null, cId = null, rId = null;

    // Extraction
    if (type === 'gorev') {
        const task = draftState.gorevler[gIndex]; // Valid before removal
        if (!task) return;
        rId = task.kurumsalRolId;
        cId = task.komisyonId;
        kId = task.koordinatorlukId;

        if (cId) {
            const kom = data.allKomisyonlar.find(k => k.id == cId);
            if (kom) {
                kId = kom.parentId;
                const koord = data.allKoordinatorlukler.find(k => k.id == kId);
                if (koord) tId = koord.parentId;
            }
        } else if (kId) {
            const koord = data.allKoordinatorlukler.find(k => k.id == kId);
            if (koord) tId = koord.parentId;
        }

    } else if (type === 'kom') {
        cId = id;
        const kom = data.allKomisyonlar.find(k => k.id == cId);
        if (kom) {
            kId = kom.parentId;
            const koord = data.allKoordinatorlukler.find(k => k.id == kId);
            if (koord) tId = koord.parentId;
        }
    } else if (type === 'koord') {
        kId = id;
        const koord = data.allKoordinatorlukler.find(k => k.id == kId);
        if (koord) tId = koord.parentId;
    } else if (type === 'tes') {
        tId = id;
    }

    // Set Editing State (Do NOT remove)
    addFormSelections.editingItem = { type, id, gIndex };

    // Set Form
    if (tId) {
        // Need to set value AND trigger cascading logic
        // We can do it by simulating change manually or just calling logic
        // Since handleAddChange is synchronous, we can call it.
        // We set ID in global selection state first? handleAddChange does that.
        // So we just call handleAddChange.
        handleAddChange('tes', tId);
    }

    if (kId && tId) {
        handleAddChange('koord', kId);
    }

    if (cId && kId) {
        handleAddChange('kom', cId);
    }

    if (rId) {
        handleAddChange('role', rId);
    }

    // Focus
    const el = document.getElementById('addTeskilat');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
};

// Global variable for Cascading dropdowns in Add Form
let addFormSelections = {
    teskilatId: null,
    koordinatorlukId: null,
    komisyonId: null,
    roleId: null,
    editingItem: null // { type, id, gIndex }
};

function renderUnifiedAddForm(state, data) {
    // Reset selections on re-render? No, keeps UI stable if they are in middle of selection?
    // Actually, re-rendering happens on ADD/REMOVE. So we Should reset the form.
    // addFormSelections = { ... }; // We shouldn't reset if we are just re-rendering to show highlight
    // But renderDrawer is called on loadData too.
    // Let's rely on manual resets in executeAdd/cancelEdit.

    const isEditing = !!addFormSelections.editingItem;

    return `
        <div class="card border-primary border-opacity-25 bg-light-primary">
            <div class="card-header bg-transparent border-bottom border-primary border-opacity-10 py-2">
                <h6 class="mb-0 text-primary">
                    <i class="bx ${isEditing ? 'bx-edit' : 'bx-plus-circle'} me-1"></i>${isEditing ? 'Yetkiyi Düzenle' : 'Yeni Yetki Tanımla'}
                </h6>
            </div>
            <div class="card-body pt-3 pb-3">
                <div class="row g-2">
                    <!-- 1. Teşkilat -->
                    <div class="col-12">
                        <select class="form-select form-select-sm" id="addTeskilat" onchange="handleAddChange('tes', this.value)">
                            <option value="">Teşkilat Seçiniz...</option>
                            ${data.allTeskilatlar.map(t => `<option value="${t.id}" ${t.id === addFormSelections.teskilatId ? 'selected' : ''}>${t.ad}</option>`).join('')}
                        </select>
                    </div>

                    <!-- 2. Koordinatörlük (Cascading) -->
                    <div class="col-12">
                         <select class="form-select form-select-sm" id="addKoordinatorluk" ${!addFormSelections.teskilatId ? 'disabled' : ''} onchange="handleAddChange('koord', this.value)">
                            <option value="">Koordinatörlük Seçiniz...</option>
                            <!-- Populated in ref via JS or we render here if data avail? 
                                 For simplicity we rely on 'handleAddChange' re-populating or we render if state is set.
                                 To keep it sync with 'addFormSelections', we should render options if parent selected.
                            -->
                            ${renderKoordOptions(data, addFormSelections.teskilatId, addFormSelections.koordinatorlukId)}
                        </select>
                    </div>

                    <!-- 3. Komisyon (Cascading) -->
                    <div class="col-12">
                        <select class="form-select form-select-sm" id="addKomisyon" ${!addFormSelections.koordinatorlukId ? 'disabled' : ''} onchange="handleAddChange('kom', this.value)">
                            <option value="">Komisyon Seçiniz (İsteğe Bağlı)...</option>
                            ${renderKomOptions(data, addFormSelections.koordinatorlukId, addFormSelections.komisyonId)}
                        </select>
                    </div>

                    <!-- 4. Rol -->
                    <div class="col-12">
                        <select class="form-select form-select-sm" id="addRole" ${!addFormSelections.teskilatId ? 'disabled' : ''} onchange="handleAddChange('role', this.value)">
                             <option value="">Rol Seçiniz...</option>
                             ${renderRoleOptions(addFormSelections.roleId)}
                        </select>
                    </div>
                </div>

                <div class="d-grid mt-3 d-flex gap-2">
                    <button class="btn btn-${isEditing ? 'warning' : 'primary'} btn-sm flex-grow-1" id="btnAddConfirm" ${!addFormSelections.roleId ? 'disabled' : ''} onclick="executeAdd()">
                        <i class="bx ${isEditing ? 'bx-save' : 'bx-check'} me-1"></i>${isEditing ? 'Yetkiyi Ekle' : 'Yetkiyi Ekle'}
                    </button>
                    ${isEditing ? `
                    <button class="btn btn-secondary btn-sm" onclick="cancelEdit()">
                        <i class="bx bx-x me-1"></i>Vazgeç
                    </button>` : ''}
                </div>
            </div>
        </div>
    `;
}

// Helper render functions to maintain state during full re-renders
function renderKoordOptions(data, parentId, selectedId) {
    if (!parentId) return '';
    const koords = data.allKoordinatorlukler.filter(k => k.parentId == parentId);
    return koords.map(k => `<option value="${k.id}" ${k.id == selectedId ? 'selected' : ''}>${k.ad}</option>`).join('');
}
function renderKomOptions(data, parentId, selectedId) {
    if (!parentId) return '';
    // Filter by both direct parent and linked Merkez coordinator
    const koms = data.allKomisyonlar.filter(k => k.parentId == parentId || k.bagliMerkezKoordinatorlukId == parentId);
    return koms.map(k => `<option value="${k.id}" ${k.id == selectedId ? 'selected' : ''}>${k.ad}</option>`).join('');
}
function renderRoleOptions(selectedId) {
    let html = '';
    const data = window.drawerRefData;
    // Check if selected teskilat is "Merkez"
    let isMerkezTeskilat = false;
    if (addFormSelections.teskilatId && data && data.allTeskilatlar) {
        const selectedTes = data.allTeskilatlar.find(t => t.id == addFormSelections.teskilatId);
        if (selectedTes && selectedTes.ad.indexOf('Merkez') > -1) {
            isMerkezTeskilat = true;
        }
    }

    const isUnitSelected = !!(addFormSelections.koordinatorlukId);

    const tasraRoles = [3]; // İl Koordinatörü
    const merkezRoles = [5, 4, 10, 9, 8, 7, 6]; // Merkez Birim Koord, Genel Koord, Genel Md, Daire Bşk, Şef, Şube Md, Uzman
    const ortakRoles = [2, 1]; // Komisyon Bşk, Personel
    const exclusiveRoles = [6, 7, 8, 9, 10]; // Mutually exclusive roles

    // Get existing roles excluding the one currently being edited
    let activeRoles = draftState.gorevler;
    if (addFormSelections.editingItem && addFormSelections.editingItem.type === 'gorev') {
        activeRoles = activeRoles.filter((_, idx) => idx !== addFormSelections.editingItem.gIndex);
    }
    const existingRoleIds = activeRoles.map(g => parseInt(g.kurumsalRolId));

    const hasExclusiveRole = existingRoleIds.some(r => exclusiveRoles.includes(r));
    const hasStandardRole = existingRoleIds.some(r => !exclusiveRoles.includes(r));

    let isMerkezBirimKoordinatorluguSelected = false;
    if (isUnitSelected && data.allKoordinatorlukler) {
        const selectedKoord = data.allKoordinatorlukler.find(k => k.id == addFormSelections.koordinatorlukId);
        if (selectedKoord && selectedKoord.ad.indexOf('Merkez Birim') > -1) {
            isMerkezBirimKoordinatorluguSelected = true;
        }
    }

    window.allKurumsalRolOptions.forEach(r => {
        let allowed = true;
        const rid = parseInt(r.value);

        if (exclusiveRoles.includes(rid)) {
            // Cannot be added if any other role exists
            if (hasStandardRole || hasExclusiveRole) allowed = false;
            // Must be Merkez without sub-units
            if (!isMerkezTeskilat || isUnitSelected) allowed = false;
        } else {
            // Cannot be added if an exclusive role exists
            if (hasExclusiveRole) allowed = false;
        }

        // --- NEW STRICT RULES ---
        if (tasraRoles.includes(rid) && isMerkezTeskilat) allowed = false;
        if (merkezRoles.includes(rid) && !isMerkezTeskilat) allowed = false;

        // Rule: If a Merkez Birim Koordinatörlüğü is selected, hide specific roles
        // Hide: Şef (8), Şube Müdürü (7), Daire Başkanı (9), Genel Müdür (10)
        if (isMerkezBirimKoordinatorluguSelected && [7, 8, 9, 10].includes(rid)) {
            allowed = false;
        }


        if (allowed) {
            html += `<option value="${r.value}" ${r.value == selectedId ? 'selected' : ''}>${r.text}</option>`;
        }
    });

    return html;
}

// Logic for Add Form Interactivity
// Logic for Add Form Interactivity
window.updateSistemRol = function (val) {
    activeDrawerTab = 'navs-sistem';
    draftState.sistemRol = val;
    draftState.yetkiliModlar = val === 'Admin'
        ? (draftState.yetkiliModlar && draftState.yetkiliModlar.length ? draftState.yetkiliModlar : ['master'])
        : [];
    renderDrawer();
};

window.toggleYetkiliMod = function (mode, checked) {
    activeDrawerTab = 'navs-sistem';
    draftState.yetkiliModlar = draftState.yetkiliModlar || [];
    if (checked && !draftState.yetkiliModlar.includes(mode)) {
        draftState.yetkiliModlar.push(mode);
    } else if (!checked) {
        draftState.yetkiliModlar = draftState.yetkiliModlar.filter(item => item !== mode);
    }
    renderDrawer();
};

window.handleAddChange = function (level, val) {
    const id = parseInt(val) || null;

    // Update Selections State
    if (level === 'tes') {
        addFormSelections.teskilatId = id;
        addFormSelections.koordinatorlukId = null;
        addFormSelections.komisyonId = null;
        addFormSelections.roleId = null;
    }
    else if (level === 'koord') {
        addFormSelections.koordinatorlukId = id;
        addFormSelections.komisyonId = null;
    }
    else if (level === 'kom') {
        addFormSelections.komisyonId = id;
    }
    else if (level === 'role') {
        addFormSelections.roleId = id;

        // Auto-update system role logic for Hierarchy roles
        const rid = parseInt(val);
        // User request: Şef(7), Şube Müdürü(8), Daire Bşk(9), Genel Md(10) -> Yönetici (2)
        // Note: 4 (Genel Koordinatör) can stay Admin or also map to Yönetici. 
        // User specifically listed "şef, şube müdürü, daire başkanı, genel müdür".
        if (rid >= 7 && rid <= 10) {
            if (draftState.sistemRol != 'Yönetici') {
                draftState.sistemRol = 'Yönetici';
                draftState.yetkiliModlar = [];
            }
        } else if (rid === 4) { // Genel Koordinatör
            if (draftState.sistemRol != 'Admin') {
                draftState.sistemRol = 'Admin';
                draftState.yetkiliModlar = ['master'];
            }
        }
    }

    // Re-render to update dependent dropdowns and button state
    renderDrawer();
};

window.executeAdd = function () {
    const s = addFormSelections;
    const isHierarchy = [4, 7, 8, 9, 10].includes(parseInt(s.roleId));

    if (!s.roleId) return;
    if (!isHierarchy && !s.koordinatorlukId) {
        alert("Lütfen bir Koordinatörlük seçiniz.");
        return;
    }

    const exclusiveRoles = [6, 7, 8, 9, 10];
    const isRequestingExclusive = exclusiveRoles.includes(parseInt(s.roleId));

    if (isRequestingExclusive) {
        let existingExclusive = false;
        draftState.gorevler.forEach((g, idx) => {
            if (s.editingItem && s.editingItem.gIndex === idx) return;
            if (exclusiveRoles.includes(parseInt(g.kurumsalRolId))) existingExclusive = true;
        });

        if (existingExclusive) {
            alert('Aynı anda iki kurumsal yönetici yetkisi olamaz.');
            return;
        }

        if (draftState.sistemRol != 'Yönetici') {
            draftState.sistemRol = 'Yönetici';
            alert('Bu kurumsal yöneticilik rolü seçildiği için personelin Sistem Rolü otomatik olarak "Yönetici" yapıldı.');
        }
    }

    // IF EDITING: Remove old item first
    if (s.editingItem) {
        removeItem(s.editingItem.type, s.editingItem.id, s.editingItem.gIndex);
    }

    // 1. Memberships
    if (s.teskilatId && !draftState.teskilatIds.includes(s.teskilatId)) {
        draftState.teskilatIds.push(s.teskilatId);
    }
    if (s.koordinatorlukId && !draftState.koordinatorlukIds.includes(s.koordinatorlukId)) {
        draftState.koordinatorlukIds.push(s.koordinatorlukId);
    }
    if (s.komisyonId && !draftState.komisyonIds.includes(s.komisyonId)) {
        draftState.komisyonIds.push(s.komisyonId);
    }

    // 2. Roles
    if (s.roleId && s.roleId !== -1) {
        draftState.gorevler.push({
            kurumsalRolId: s.roleId,
            koordinatorlukId: s.koordinatorlukId,
            komisyonId: s.komisyonId
        });
    }

    // Reset Form & Editing State
    cancelEdit();
};

window.cancelEdit = function () {
    addFormSelections = { teskilatId: null, koordinatorlukId: null, komisyonId: null, roleId: null, editingItem: null };
    renderDrawer();
};

window.removeItem = function (type, id, gIndex) {
    const data = window.drawerRefData;

    // Helper to find parent Koord of a Komisyon
    const getKomParent = (komId) => {
        const kom = data.allKomisyonlar.find(k => k.id == komId);
        return kom ? kom.parentId : null;
    };

    // Helper to find parent Teskilat of a Koordinatorluk
    const getKoordParent = (koordId) => {
        const koord = data.allKoordinatorlukler.find(k => k.id == koordId);
        return koord ? koord.parentId : null;
    };

    // Helper to remove Teskilat
    const removeTeskilat = (tesId) => {
        if (!tesId) return;
        draftState.teskilatIds = draftState.teskilatIds.filter(i => i !== tesId);
    };

    // Helper to remove Koordinatorluk
    const removeKoordinatorluk = (koordId) => {
        if (!koordId) return;
        draftState.koordinatorlukIds = draftState.koordinatorlukIds.filter(i => i !== koordId);
        // Cascade up to Teskilat
        removeTeskilat(getKoordParent(koordId));
    };

    // Helper to remove Komisyon
    const removeKomisyon = (komId) => {
        if (!komId) return;
        draftState.komisyonIds = draftState.komisyonIds.filter(i => i !== komId);
        // Cascade up to Koordinatorluk
        removeKoordinatorluk(getKomParent(komId));
    };


    if (type === 'gorev') {
        const task = draftState.gorevler[gIndex];
        // Remove the role assignment
        draftState.gorevler.splice(gIndex, 1);

        // Cascade Delete Context
        if (task) {
            if (task.komisyonId) {
                removeKomisyon(task.komisyonId);
            } else if (task.koordinatorlukId) {
                removeKoordinatorluk(task.koordinatorlukId);
            } else {
                // If just Teskilat? (Rare for explicit role but possible)
                // We don't track teskilatId in gorev object explicitly based on previous read, 
                // but if we did, we would handle it. 
                // Explicit roles usually sit on Koord or Kom.
            }
        }

    } else if (type === 'kom') {
        // Remove Komisyon
        removeKomisyon(id);

        // Remove explicit roles bound to this commission
        draftState.gorevler = draftState.gorevler.filter(g => g.komisyonId !== id);

    } else if (type === 'koord') {
        // Remove Koordinatorluk
        removeKoordinatorluk(id);

        // Remove child Commissions
        const komsToRemove = data.allKomisyonlar.filter(k => k.parentId === id).map(k => k.id);
        draftState.komisyonIds = draftState.komisyonIds.filter(kid => !komsToRemove.includes(kid));

        // Remove linked Roles
        draftState.gorevler = draftState.gorevler.filter(g => g.koordinatorlukId !== id && (!g.komisyonId || !komsToRemove.includes(g.komisyonId)));

    } else if (type === 'tes') {
        // Remove Teskilat
        removeTeskilat(id);

        // Remove child Koordinatorluks
        const koordsToRemove = data.allKoordinatorlukler.filter(k => k.parentId === id).map(k => k.id);
        draftState.koordinatorlukIds = draftState.koordinatorlukIds.filter(kid => !koordsToRemove.includes(kid));

        // Remove child Commissions (grand-children)
        // Find all commissions belonging to these koords
        const komsToRemove = data.allKomisyonlar.filter(k => koordsToRemove.includes(k.parentId)).map(k => k.id);
        draftState.komisyonIds = draftState.komisyonIds.filter(kid => !komsToRemove.includes(kid));

        // Remove linked Roles
        draftState.gorevler = draftState.gorevler.filter(g => {
            // Check implicit link via Koord or Kom
            // Since we cleared lists, we can't easily check coverage, ensuring by ID matching
            if (g.koordinatorlukId && koordsToRemove.includes(g.koordinatorlukId)) return false;
            if (g.komisyonId && komsToRemove.includes(g.komisyonId)) return false;
            return true;
        });
    }

    renderDrawer();
};




// --- SAVE / CANCEL ---
function cancelDraft() {
    if (!isDirty()) return;
    draftState = JSON.parse(JSON.stringify(originalState));
    renderDrawer();
}

async function saveDraft() {
    if (!isDirty()) return;

    // Show loading?
    const btn = document.querySelector('.offcanvas-footer .btn-primary');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Kaydediliyor...';

    const payload = {
        PersonelId: originalState.personelId,
        SistemRol: draftState.sistemRol,
        YetkiliModlar: draftState.yetkiliModlar || [],
        TeskilatIds: draftState.teskilatIds,
        KoordinatorlukIds: draftState.koordinatorlukIds,
        KomisyonIds: draftState.komisyonIds,
        Gorevler: draftState.gorevler
    };

    try {
        const response = await fetch('/Personel/SaveYetkilendirme', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText);
        }

        // Success
        // Update original state to match current
        // Ideally fetch fresh data from response to ensure sync (IDs etc)
        const freshData = await response.json();

        // We need to re-init everything with fresh data
        // Simulate loadDraftData behavior
        const data = freshData;
        window.drawerRefData = data;

        originalState = { // Reconstruct original state from fresh data
            personelId: data.personelId,
            sistemRol: data.sistemRol,
            yetkiliModlar: data.yetkiliModlar || [],
            teskilatIds: data.selectedTeskilatIds || [],
            koordinatorlukIds: data.selectedKoordinatorlukIds || [],
            komisyonIds: data.selectedKomisyonIds || [],
            gorevler: data.kurumsalRolAssignments.map(a => ({
                kurumsalRolId: a.kurumsalRolId,
                koordinatorlukId: a.koordinatorlukId,
                komisyonId: a.komisyonId
            }))
        };
        draftState = JSON.parse(JSON.stringify(originalState));

        renderDrawer();

        // Close Drawer Immediately
        const drawerEl = document.getElementById('offcanvasEnd');
        const instance = bootstrap.Offcanvas.getInstance(drawerEl);
        if (instance) instance.hide();

        // Show Success Modal
        Swal.fire({
            icon: 'success',
            title: 'Kaydedildi',
            text: 'Yetkilendirme başarıyla güncellendi.',
            showConfirmButton: true,
            confirmButtonText: 'Tamam',
            timer: 2000 // Optional: Auto close and reload after 2s if user doesn't click
        }).then(() => {
            try { if (window.saveYetkilendirmeFilterState) window.saveYetkilendirmeFilterState(); } catch (e) { }
            location.reload();
        });

    } catch (error) {
        console.error(error);
        // Clean up message
        let msg = error.message;
        try {
            const json = JSON.parse(msg);
            msg = json.message || json.title || msg;
        } catch (e) { }

        Swal.fire('Uyarı', msg, 'warning');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
