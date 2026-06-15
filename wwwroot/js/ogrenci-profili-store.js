(function () {
    const recordsKey = 'tegm-ogrenci-profili-yonetimi-records-v1';
    const definitionsKey = 'tegm-ogrenci-profili-tanimlari-v1';
    const categoryOrder = ['Temel Eğitim', 'Ortaöğretim', 'Din Öğretimi'];

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function uniqueById(items) {
        const map = new Map();
        items.forEach(item => map.set(item.id, item));
        return [...map.values()];
    }

    function sortByName(items) {
        return [...items].sort((a, b) => a.name.localeCompare(b.name, 'tr', { numeric: true }));
    }

    function sortCategories(items) {
        return [...items].sort((a, b) => {
            const ai = categoryOrder.indexOf(a.name);
            const bi = categoryOrder.indexOf(b.name);
            if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
            return a.name.localeCompare(b.name, 'tr', { numeric: true });
        });
    }

    function slug(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/ı/g, 'i')
            .replace(/İ/g, 'I')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'tanim';
    }

    function makeId(prefix, parts) {
        return `${prefix}-${parts.map(slug).join('-')}`;
    }

    function normalizeRecord(record, index) {
        const anaProfiller = Array.isArray(record.anaProfiller)
            ? record.anaProfiller
            : (Array.isArray(record.ana_profiller) ? record.ana_profiller : []);
        const destekProfiller = Array.isArray(record.destekProfiller)
            ? record.destekProfiller
            : (Array.isArray(record.destekleyici_profiller) ? record.destekleyici_profiller : []);

        return {
            ...record,
            id: record.id || ['record', index, record.kategori, record.ders, record.sinif, record.unite].join('|'),
            kategori: record.kategori || record.category || 'Temel Eğitim',
            ders: record.ders || record.brans || '',
            sinif: record.sinif || '',
            unite: record.unite || '',
            anaProfiller,
            destekProfiller,
            anaProfilRaw: record.anaProfilRaw || anaProfiller.join(', '),
            destekProfilRaw: record.destekProfilRaw || destekProfiller.join(', ')
        };
    }

    function normalizeRecords(records) {
        return (records || []).map(normalizeRecord);
    }

    function readJson(key, fallback) {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        try {
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

    function buildDefinitions(records) {
        const categories = [];
        const lessons = [];
        const classes = [];
        const themes = [];

        normalizeRecords(records).forEach(record => {
            const kategori = (record.kategori || '').trim();
            const ders = (record.ders || '').trim();
            const sinif = (record.sinif || '').trim();
            const tema = (record.unite || '').trim();
            if (!kategori) return;

            const categoryId = makeId('kat', [kategori]);
            categories.push({ id: categoryId, name: kategori });

            if (!ders) return;
            const lessonId = makeId('ders', [kategori, ders]);
            lessons.push({ id: lessonId, categoryId, name: ders });

            if (!sinif) return;
            const classId = makeId('sinif', [kategori, ders, sinif]);
            classes.push({ id: classId, categoryId, lessonId, name: sinif });

            if (!tema) return;
            themes.push({ id: makeId('tema', [kategori, ders, sinif, tema]), categoryId, lessonId, classId, name: tema });
        });

        return {
            categories: sortCategories(uniqueById(categories)),
            lessons: sortByName(uniqueById(lessons)),
            classes: sortByName(uniqueById(classes)),
            themes: sortByName(uniqueById(themes))
        };
    }

    function mergeDefinitions(base, stored) {
        if (!stored) return base;
        return {
            categories: sortCategories(uniqueById([...(base.categories || []), ...(stored.categories || [])])),
            lessons: sortByName(uniqueById([...(base.lessons || []), ...(stored.lessons || [])])),
            classes: sortByName(uniqueById([...(base.classes || []), ...(stored.classes || [])])),
            themes: sortByName(uniqueById([...(base.themes || []), ...(stored.themes || [])]))
        };
    }

    function loadDefinitions(baseRecords) {
        const base = buildDefinitions(baseRecords || []);
        return mergeDefinitions(base, readJson(definitionsKey, null));
    }

    function saveDefinitions(definitions) {
        localStorage.setItem(definitionsKey, JSON.stringify(definitions));
        window.dispatchEvent(new CustomEvent('ogrenciProfiliDefinitionsChanged', { detail: clone(definitions) }));
    }

    function loadRecords(baseRecords) {
        const stored = readJson(recordsKey, null);
        return Array.isArray(stored) ? normalizeRecords(stored) : normalizeRecords(baseRecords);
    }

    function saveRecords(records) {
        const normalized = normalizeRecords(records);
        localStorage.setItem(recordsKey, JSON.stringify(normalized));
        window.dispatchEvent(new CustomEvent('ogrenciProfiliRecordsChanged', { detail: clone(normalized) }));
    }

    async function loadData(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Veri kaynağı okunamadı.');
        const payload = await response.json();
        const baseRecords = normalizeRecords(payload.records || []);
        const records = loadRecords(baseRecords);
        const definitions = loadDefinitions(baseRecords);
        return {
            ...payload,
            baseRecords,
            records,
            definitions,
            summary: {
                ...(payload.summary || {}),
                records: records.length,
                categories: definitions.categories.length,
                classes: definitions.classes.length,
                lessons: definitions.lessons.length,
                units: definitions.themes.length,
                profiles: new Set(records.flatMap(record => [...(record.anaProfiller || []), ...(record.destekProfiller || [])])).size
            }
        };
    }

    window.OgrenciProfiliStore = {
        recordsKey,
        definitionsKey,
        makeId,
        normalizeRecord,
        normalizeRecords,
        buildDefinitions,
        loadDefinitions,
        saveDefinitions,
        loadRecords,
        saveRecords,
        loadData,
        sortByName,
        sortCategories
    };
})();
