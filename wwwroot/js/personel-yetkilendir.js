document.addEventListener('DOMContentLoaded', function () {

    // --- Fake Data ---
    const MOCK_DATA = [
        { id: 1, name: "Deniz Şimşek", img: "", teskilat: "Merkez", komisyonlar: ["Matematik Komisyonu"], sistemRol: "Admin", kurumsalRol: "İl Koordinatörü", il: "Ankara" },
        { id: 2, name: "Deniz Şahin", img: "", teskilat: "Taşra", komisyonlar: ["Türkçe Komisyonu"], sistemRol: "Admin", kurumsalRol: "Kullanıcı", il: "Mardin" },
        { id: 3, name: "Gamze Yıldırım", img: "", teskilat: "Taşra", komisyonlar: ["Fen Bilimleri Komisyonu"], sistemRol: "Kullanıcı", kurumsalRol: "Kullanıcı", il: "Şırnak" },
        { id: 4, name: "Burak Çelik", img: "", teskilat: "Taşra", komisyonlar: ["Türkçe Komisyonu"], sistemRol: "Kullanıcı", kurumsalRol: "Personel", il: "Afyonkarahisar" },
        { id: 5, name: "Mehmet Doğan", img: "", teskilat: "Taşra", komisyonlar: ["İngilizce Komisyonu"], sistemRol: "Kullanıcı", kurumsalRol: "Personel", il: "Bartın" },
        { id: 6, name: "Selin Şahin", img: "", teskilat: "Merkez", komisyonlar: ["Matematik Komisyonu"], sistemRol: "Personel", kurumsalRol: "Personel", il: "Ankara" },
        { id: 7, name: "Zeynep Yılmaz", img: "", teskilat: "Taşra", komisyonlar: ["Türkçe Komisyonu"], sistemRol: "Personel", kurumsalRol: "Personel", il: "Gümüşhane" },
        { id: 8, name: "Deniz Aslan", img: "", teskilat: "Taşra", komisyonlar: ["Bilişim Komisyonu"], sistemRol: "Personel", kurumsalRol: "Personel", il: "Sivas" },
        { id: 9, name: "Onur Demir", img: "", teskilat: "Taşra", komisyonlar: ["Fen Bilimleri Komisyonu"], sistemRol: "Personel", kurumsalRol: "Personel", il: "İzmir" },
        { id: 10, name: "Vedat Ersin CEVİZ", img: "/sevilay-tema/assets/img/avatars/1.png", teskilat: "Merkez", komisyonlar: ["Türkçe Komisyonu"], sistemRol: "Admin", kurumsalRol: "Personel", il: "Ankara" },
        { id: 11, name: "Ahmet Yılmaz", img: "", teskilat: "Taşra", komisyonlar: [], sistemRol: "Kullanıcı", kurumsalRol: "Personel", il: "İstanbul" },
        { id: 12, name: "Ayşe Demir", img: "", teskilat: "Merkez", komisyonlar: ["Tarih Komisyonu"], sistemRol: "Admin", kurumsalRol: "Komisyon Başkanı", il: "Ankara" }
    ];

    // --- State ---
    let state = {
        users: [...MOCK_DATA],
        filteredUsers: [...MOCK_DATA],
        selectedUserId: null,
        isDrawerOpen: true
    };

    // --- DOM Elements ---
    const tableBody = document.getElementById('personelTableBody');
    const tableWrapper = document.getElementById('authTableWrapper');
    const drawer = document.getElementById('authDrawer');

    // Filters
    const searchFilter = document.getElementById('searchFilter');
    const teskilatFilter = document.getElementById('teskilatFilter');
    const sistemRolFilter = document.getElementById('sistemRolFilter');
    const kurumsalRolFilter = document.getElementById('kurumsalRolFilter');
    const komisyonFilter = document.getElementById('komisyonFilter');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');

    // Drawer Elements
    const drawerName = document.getElementById('drawerName');
    const drawerTeskilat = document.getElementById('drawerTeskilat');
    const drawerAvatar = document.getElementById('drawerAvatar');
    const drawerAvatarPlaceholder = document.getElementById('drawerAvatarPlaceholder');
    const drawerTeskilatSelect = document.getElementById('drawerTeskilatSelect');
    const drawerKoordinatorluk = document.getElementById('drawerKoordinatorluk');
    const drawerKomisyonChips = document.getElementById('drawerKomisyonChips');
    const drawerKomisyonAdd = document.getElementById('drawerKomisyonAdd');
    const drawerKurumsalRol = document.getElementById('drawerKurumsalRol');
    const drawerSistemRol = document.getElementById('drawerSistemRol');
    const radioScopeSelf = document.querySelector('input[name="scope"][value="Self"]');

    // Tabs
    const tabBtns = document.querySelectorAll('.drawer-tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Drawer Actions
    const drawerCloseBtn = document.getElementById('drawerCloseBtn');
    const drawerCancelBtn = document.getElementById('drawerCancelBtn');
    const drawerSaveBtn = document.getElementById('drawerSaveBtn');

    // --- Init ---
    init();

    function init() {
        applyFilters(); // Initial render

        // Setup Filters
        searchFilter.addEventListener('input', applyFilters);
        teskilatFilter.addEventListener('change', applyFilters);
        sistemRolFilter.addEventListener('change', applyFilters);
        kurumsalRolFilter.addEventListener('change', applyFilters);
        komisyonFilter.addEventListener('change', applyFilters);
        clearFiltersBtn.addEventListener('click', clearFilters);

        // Drawer Tabs
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.style.display = 'none');

                e.target.classList.add('active');
                const targetId = e.target.dataset.tab === 'kurumsal' ? 'tabKurumsal' : 'tabSistemsel';
                document.getElementById(targetId).style.display = 'block';
            });
        });

        // Drawer Close
        drawerCloseBtn.addEventListener('click', closeDrawer);
        drawerCancelBtn.addEventListener('click', closeDrawer);

        // Komisyon Add
        drawerKomisyonAdd.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val && state.selectedUserId) {
                const user = state.users.find(u => u.id === state.selectedUserId);
                if (user && !user.komisyonlar.includes(val)) {
                    user.komisyonlar.push(val);
                    populateDrawer(user.id); // Refresh drawer
                    renderTable(); // Refresh table chips
                }
                e.target.value = "";
            }
        });

        // Save
        drawerSaveBtn.addEventListener('click', () => {
            if (!state.selectedUserId) return;
            const user = state.users.find(u => u.id === state.selectedUserId);
            // Read values from form
            if (user) {
                user.kurumsalRol = drawerKurumsalRol.value;
                user.sistemRol = drawerSistemRol.value;
                // Scope is just UI for now
                console.log("Saving User:", user);
                alert("Kaydedildi (Console log kontrol edin)");
                renderTable();
            }
        });

        // Select first if available
        if (state.filteredUsers.length > 0) {
            selectUser(state.filteredUsers[0].id);
        } else {
            closeDrawer();
        }
    }

    // --- Core Logic ---

    function applyFilters() {
        const search = searchFilter.value.toLowerCase();
        const teskilat = teskilatFilter.value;
        const sRol = sistemRolFilter.value;
        const kRol = kurumsalRolFilter.value;
        const kom = komisyonFilter.value;

        state.filteredUsers = state.users.filter(u => {
            const matchName = u.name.toLowerCase().includes(search);
            const matchTeskilat = !teskilat || u.teskilat === teskilat;
            const matchSRol = !sRol || u.sistemRol === sRol;
            const matchKRol = !kRol || u.kurumsalRol === kRol;
            const matchKom = !kom || u.komisyonlar.includes(kom);
            return matchName && matchTeskilat && matchSRol && matchKRol && matchKom;
        });

        renderTable();

        // If selected user is filtered out, select first visible
        if (state.selectedUserId && !state.filteredUsers.find(u => u.id === state.selectedUserId)) {
            if (state.filteredUsers.length > 0) {
                selectUser(state.filteredUsers[0].id);
            } else {
                closeDrawer();
                state.selectedUserId = null;
            }
        } else if (!state.selectedUserId && state.filteredUsers.length > 0) {
            selectUser(state.filteredUsers[0].id);
        }
    }

    function clearFilters() {
        searchFilter.value = "";
        teskilatFilter.value = "";
        sistemRolFilter.value = "";
        kurumsalRolFilter.value = "";
        komisyonFilter.value = "";
        applyFilters();
    }

    function renderTable() {
        tableBody.innerHTML = "";
        if (state.filteredUsers.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4">Kayıt bulunamadı.</td></tr>`;
            return;
        }

        state.filteredUsers.forEach(user => {
            const tr = document.createElement('tr');
            if (user.id === state.selectedUserId) tr.classList.add('selected');

            tr.onclick = () => selectUser(user.id);

            const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const avatarHtml = user.img
                ? `<img src="${user.img}" class="auth-avatar" style="width:36px;height:36px;">`
                : `<div class="auth-avatar" style="width:36px;height:36px;font-size:0.8rem;">${initials}</div>`;

            const koordinatorluk = user.teskilat === "Merkez" ? "Ankara TEGM" : `${user.il} İl Koordinatörlüğü`;

            let badges = "";
            user.komisyonlar.forEach((k, idx) => {
                if (idx < 2) badges += `<span class="badge bg-label-primary me-1">${k}</span>`;
            });
            if (user.komisyonlar.length > 2) badges += `<span class="badge bg-label-secondary">+${user.komisyonlar.length - 2}</span>`;

            tr.innerHTML = `
                <td>${avatarHtml}</td>
                <td class="fw-semibold">${user.name}</td>
                <td><span class="badge ${user.teskilat === 'Merkez' ? 'badge-loc-merkez' : 'badge-loc-tasra'}">${user.teskilat}</span></td>
                <td>${koordinatorluk}</td>
                <td>${badges}</td>
                <td><span class="badge ${user.sistemRol === 'Admin' ? 'badge-role-admin' : 'badge-role-user'}">${user.sistemRol}</span></td>
                <td>${user.kurumsalRol}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    function selectUser(id) {
        state.selectedUserId = id;
        renderTable(); // Update highlight
        openDrawer();
        populateDrawer(id);
    }

    function openDrawer() {
        state.isDrawerOpen = true;
        drawer.classList.add('open');
        // Width transition handled by CSS
        // But we might want to resize table based on design, currently CSS flex/width handles overlap or squeeze
        // Design request: Table 68%, Drawer 32%.
        // The CSS .auth-drawer-wrapper.open sets width 400px.
        // Table wrapper uses flex:1, so it shrinks automatically.
    }

    function closeDrawer() {
        state.isDrawerOpen = false;
        drawer.classList.remove('open');
        // Optional: Deselect user? Requirement says "selected row selected kalsın".
        // But if user clicks row, it opens again.
    }

    function populateDrawer(id) {
        const user = state.users.find(u => u.id === id);
        if (!user) return;

        // Header
        drawerName.textContent = user.name;
        drawerTeskilat.textContent = user.teskilat;

        if (user.img) {
            drawerAvatar.src = user.img;
            drawerAvatar.style.display = 'block';
            drawerAvatarPlaceholder.style.display = 'none';
        } else {
            drawerAvatar.style.display = 'none';
            drawerAvatarPlaceholder.style.display = 'flex';
            drawerAvatarPlaceholder.textContent = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        }

        // Form Fields
        drawerTeskilatSelect.value = user.teskilat;
        drawerKoordinatorluk.value = user.teskilat === "Merkez" ? "Ankara TEGM" : `${user.il} İl Koordinatörlüğü`;

        // Komisyon Chips
        drawerKomisyonChips.innerHTML = "";
        user.komisyonlar.forEach(k => {
            const chip = document.createElement('div');
            chip.className = "chip";
            chip.innerHTML = `${k} <button onclick="removeKomisyon(${id}, '${k}')">&times;</button>`;
            drawerKomisyonChips.appendChild(chip);
        });

        // Toggle Option Visibility based on Teskilat
        // Array.from(drawerKurumsalRol.options).forEach(opt => {
        //     if (opt.value === "İl Koordinatörü") {
        //         opt.style.display = user.teskilat === "Merkez" ? "none" : "block"; // Start Simple
        //         // Select2 handles display differently (might need to rebuild or disable)
        //         // Use simple disable for now if select2 is not init on drawer inputs (checked HTML, they are .form-control-custom)
        //         // HTML shows they are standard selects but might be enhanced?
        //         // JS init only enhances filters. Drawer inputs seem standard.
        //         opt.hidden = user.teskilat === "Merkez";
        //         opt.disabled = user.teskilat === "Merkez";
        //     }
        // });

        // Standard Select Option Hiding
        const ilKoordOpt = Array.from(drawerKurumsalRol.options).find(o => o.value === "İl Koordinatörü");
        if (ilKoordOpt) {
            const isMerkez = user.teskilat === "Merkez";
            ilKoordOpt.hidden = isMerkez; // Hide if Merkez (Only for Taşra)
            ilKoordOpt.disabled = isMerkez;

            if (isMerkez && drawerKurumsalRol.value === "İl Koordinatörü") {
                drawerKurumsalRol.value = "Personel";
            }
        }

        const merkezBirimOpt = Array.from(drawerKurumsalRol.options).find(o => o.value === "Merkez Birim Koordinatörlüğü");
        if (merkezBirimOpt) {
            const isMerkez = user.teskilat === "Merkez";
            merkezBirimOpt.hidden = !isMerkez; // Hide if NOT Merkez (Only for Merkez)
            merkezBirimOpt.disabled = !isMerkez;

            if (!isMerkez && drawerKurumsalRol.value === "Merkez Birim Koordinatörlüğü") {
                drawerKurumsalRol.value = "Personel";
            }
        }

        drawerKurumsalRol.value = user.kurumsalRol;
        drawerSistemRol.value = user.sistemRol;
        radioScopeSelf.checked = true; // Reset scope
    }

    // Expose valid removal function to window for onclick in innerHTML
    window.removeKomisyon = function (userId, kVal) {
        const user = state.users.find(u => u.id === userId);
        if (user) {
            user.komisyonlar = user.komisyonlar.filter(k => k !== kVal);
            populateDrawer(userId);
            renderTable();
        }
    };

});
