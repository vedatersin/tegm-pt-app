/**
 * Türkiye İlleri SVG Haritası
 * 81 il için basitleştirilmiş SVG path verileri
 * data-plaka: Plaka kodu (1-81)
 * data-name: İl adı
 */
function initTurkeyMap(containerId, illerData, onClickCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // SVG oluştur
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 1000 450");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.style.width = "100%";
    svg.style.height = "auto";

    // 81 il path verileri (basitleştirilmiş)
    const ilPaths = [
        { plaka: 1, ad: "Adana", d: "M440,310 L460,300 L475,305 L480,320 L465,330 L445,325 Z" },
        { plaka: 2, ad: "Adıyaman", d: "M530,280 L550,275 L560,285 L555,300 L540,300 L530,290 Z" },
        { plaka: 3, ad: "Afyonkarahisar", d: "M280,230 L300,220 L320,230 L315,250 L295,255 L280,245 Z" },
        { plaka: 4, ad: "Ağrı", d: "M750,200 L775,190 L795,200 L790,220 L770,225 L750,215 Z" },
        { plaka: 5, ad: "Amasya", d: "M490,180 L510,172 L525,180 L520,195 L505,198 L490,192 Z" },
        { plaka: 6, ad: "Ankara", d: "M355,195 L385,180 L410,190 L415,215 L395,230 L370,225 L355,210 Z" },
        { plaka: 7, ad: "Antalya", d: "M280,310 L310,290 L340,300 L355,320 L345,345 L310,350 L285,340 L275,325 Z" },
        { plaka: 8, ad: "Artvin", d: "M680,130 L700,125 L710,135 L705,150 L690,152 L680,142 Z" },
        { plaka: 9, ad: "Aydın", d: "M175,295 L200,285 L220,295 L215,312 L195,318 L175,310 Z" },
        { plaka: 10, ad: "Balıkesir", d: "M165,180 L195,165 L220,175 L215,200 L190,210 L165,200 Z" },
        { plaka: 11, ad: "Bilecik", d: "M275,190 L290,183 L300,190 L297,202 L285,205 L275,198 Z" },
        { plaka: 12, ad: "Bingöl", d: "M630,230 L650,222 L665,230 L660,248 L645,252 L630,243 Z" },
        { plaka: 13, ad: "Bitlis", d: "M700,240 L720,232 L735,240 L730,258 L715,262 L700,253 Z" },
        { plaka: 14, ad: "Bolu", d: "M335,165 L355,158 L370,165 L367,180 L352,184 L335,177 Z" },
        { plaka: 15, ad: "Burdur", d: "M275,280 L295,272 L310,280 L305,296 L290,300 L275,292 Z" },
        { plaka: 16, ad: "Bursa", d: "M215,180 L240,170 L265,180 L260,200 L238,208 L215,198 Z" },
        { plaka: 17, ad: "Çanakkale", d: "M125,170 L155,155 L175,168 L170,190 L145,198 L125,188 Z" },
        { plaka: 18, ad: "Çankırı", d: "M400,170 L420,162 L435,170 L432,185 L418,190 L400,183 Z" },
        { plaka: 19, ad: "Çorum", d: "M445,170 L470,160 L490,170 L485,190 L465,196 L445,188 Z" },
        { plaka: 20, ad: "Denizli", d: "M225,280 L250,270 L270,280 L265,298 L245,305 L225,296 Z" },
        { plaka: 21, ad: "Diyarbakır", d: "M580,260 L610,248 L630,260 L625,282 L605,290 L580,278 Z" },
        { plaka: 22, ad: "Edirne", d: "M95,105 L120,95 L140,108 L135,128 L115,135 L95,122 Z" },
        { plaka: 23, ad: "Elazığ", d: "M575,230 L600,220 L620,230 L615,250 L595,256 L575,245 Z" },
        { plaka: 24, ad: "Erzincan", d: "M600,195 L630,185 L650,195 L645,215 L625,222 L600,212 Z" },
        { plaka: 25, ad: "Erzurum", d: "M680,185 L715,172 L740,185 L735,210 L710,218 L680,208 Z" },
        { plaka: 26, ad: "Eskişehir", d: "M290,200 L320,190 L345,200 L340,220 L315,228 L290,218 Z" },
        { plaka: 27, ad: "Gaziantep", d: "M510,305 L535,295 L555,305 L550,322 L530,328 L510,318 Z" },
        { plaka: 28, ad: "Giresun", d: "M575,155 L600,148 L615,155 L610,168 L595,172 L575,165 Z" },
        { plaka: 29, ad: "Gümüşhane", d: "M620,165 L640,158 L655,165 L650,178 L638,182 L620,175 Z" },
        { plaka: 30, ad: "Hakkari", d: "M765,265 L790,258 L805,268 L798,285 L780,290 L765,280 Z" },
        { plaka: 31, ad: "Hatay", d: "M480,340 L500,328 L515,340 L510,362 L495,368 L480,358 Z" },
        { plaka: 32, ad: "Isparta", d: "M280,260 L300,252 L318,260 L312,278 L296,282 L280,274 Z" },
        { plaka: 33, ad: "Mersin", d: "M395,330 L425,318 L450,328 L445,350 L420,358 L395,348 Z" },
        { plaka: 34, ad: "İstanbul", d: "M180,140 L210,130 L230,142 L225,158 L205,164 L180,155 Z" },
        { plaka: 35, ad: "İzmir", d: "M135,235 L165,222 L185,235 L180,260 L158,268 L135,255 Z" },
        { plaka: 36, ad: "Kars", d: "M755,175 L780,165 L800,178 L795,198 L775,205 L755,195 Z" },
        { plaka: 37, ad: "Kastamonu", d: "M400,140 L435,128 L460,140 L455,158 L430,165 L400,155 Z" },
        { plaka: 38, ad: "Kayseri", d: "M460,245 L490,235 L515,245 L510,268 L488,275 L460,262 Z" },
        { plaka: 39, ad: "Kırklareli", d: "M125,95 L150,85 L170,98 L165,118 L145,125 L125,112 Z" },
        { plaka: 40, ad: "Kırşehir", d: "M420,220 L440,212 L455,220 L452,238 L438,242 L420,233 Z" },
        { plaka: 41, ad: "Kocaeli", d: "M240,155 L258,148 L270,155 L267,168 L255,172 L240,165 Z" },
        { plaka: 42, ad: "Konya", d: "M340,260 L380,245 L415,260 L425,290 L405,310 L365,315 L340,300 L330,278 Z" },
        { plaka: 43, ad: "Kütahya", d: "M250,210 L275,200 L295,210 L290,230 L270,238 L250,228 Z" },
        { plaka: 44, ad: "Malatya", d: "M540,240 L565,230 L585,240 L580,260 L560,268 L540,255 Z" },
        { plaka: 45, ad: "Manisa", d: "M170,240 L198,228 L218,240 L212,260 L192,268 L170,258 Z" },
        { plaka: 46, ad: "Kahramanmaraş", d: "M495,278 L520,268 L540,278 L535,298 L515,305 L495,295 Z" },
        { plaka: 47, ad: "Mardin", d: "M610,290 L640,282 L660,292 L655,310 L635,315 L610,305 Z" },
        { plaka: 48, ad: "Muğla", d: "M195,310 L225,298 L245,310 L240,335 L220,342 L198,332 Z" },
        { plaka: 49, ad: "Muş", d: "M670,228 L695,218 L712,228 L708,248 L690,255 L670,245 Z" },
        { plaka: 50, ad: "Nevşehir", d: "M435,252 L455,244 L468,252 L465,268 L450,272 L435,265 Z" },
        { plaka: 51, ad: "Niğde", d: "M430,280 L450,272 L465,280 L460,298 L445,305 L430,295 Z" },
        { plaka: 52, ad: "Ordu", d: "M540,155 L565,148 L580,155 L575,168 L560,172 L540,165 Z" },
        { plaka: 53, ad: "Rize", d: "M650,140 L672,132 L688,140 L684,155 L668,158 L650,150 Z" },
        { plaka: 54, ad: "Sakarya", d: "M270,158 L288,150 L302,158 L298,172 L285,176 L270,168 Z" },
        { plaka: 55, ad: "Samsun", d: "M500,145 L530,135 L555,148 L550,165 L525,172 L500,162 Z" },
        { plaka: 56, ad: "Siirt", d: "M665,270 L685,262 L700,270 L695,288 L680,292 L665,282 Z" },
        { plaka: 57, ad: "Sinop", d: "M460,130 L485,120 L505,132 L500,148 L480,155 L460,145 Z" },
        { plaka: 58, ad: "Sivas", d: "M530,200 L565,188 L595,200 L590,225 L565,232 L530,220 Z" },
        { plaka: 59, ad: "Tekirdağ", d: "M145,118 L172,108 L190,120 L185,138 L168,145 L145,135 Z" },
        { plaka: 60, ad: "Tokat", d: "M510,180 L535,172 L555,182 L550,198 L532,205 L510,195 Z" },
        { plaka: 61, ad: "Trabzon", d: "M625,145 L648,135 L665,145 L660,160 L645,165 L625,157 Z" },
        { plaka: 62, ad: "Tunceli", d: "M610,225 L630,218 L645,225 L640,240 L628,245 L610,238 Z" },
        { plaka: 63, ad: "Şanlıurfa", d: "M560,290 L590,278 L615,290 L610,315 L585,322 L560,310 Z" },
        { plaka: 64, ad: "Uşak", d: "M240,250 L260,242 L278,250 L274,265 L258,270 L240,262 Z" },
        { plaka: 65, ad: "Van", d: "M740,235 L770,225 L790,238 L785,260 L765,268 L740,255 Z" },
        { plaka: 66, ad: "Yozgat", d: "M440,200 L465,190 L485,200 L480,220 L462,226 L440,215 Z" },
        { plaka: 67, ad: "Zonguldak", d: "M330,140 L350,132 L365,142 L360,158 L348,162 L330,152 Z" },
        { plaka: 68, ad: "Aksaray", d: "M395,255 L415,248 L430,255 L425,270 L412,275 L395,268 Z" },
        { plaka: 69, ad: "Bayburt", d: "M650,172 L668,165 L680,172 L676,186 L665,190 L650,182 Z" },
        { plaka: 70, ad: "Karaman", d: "M370,295 L390,288 L405,295 L400,312 L385,318 L370,308 Z" },
        { plaka: 71, ad: "Kırıkkale", d: "M410,200 L425,194 L438,200 L435,212 L422,216 L410,210 Z" },
        { plaka: 72, ad: "Batman", d: "M640,268 L660,260 L675,268 L670,285 L655,290 L640,280 Z" },
        { plaka: 73, ad: "Şırnak", d: "M700,280 L725,272 L742,282 L738,300 L720,305 L700,295 Z" },
        { plaka: 74, ad: "Bartın", d: "M350,130 L368,124 L380,132 L376,145 L365,148 L350,140 Z" },
        { plaka: 75, ad: "Ardahan", d: "M720,160 L745,150 L760,162 L755,180 L738,185 L720,175 Z" },
        { plaka: 76, ad: "Iğdır", d: "M790,195 L812,188 L825,198 L820,212 L805,218 L790,208 Z" },
        { plaka: 77, ad: "Yalova", d: "M220,165 L235,158 L248,165 L245,175 L233,178 L220,172 Z" },
        { plaka: 78, ad: "Karabük", d: "M370,148 L388,140 L400,148 L396,162 L385,166 L370,158 Z" },
        { plaka: 79, ad: "Kilis", d: "M505,320 L520,315 L530,322 L526,335 L515,338 L505,330 Z" },
        { plaka: 80, ad: "Osmaniye", d: "M470,310 L488,302 L502,312 L498,328 L484,332 L470,322 Z" },
        { plaka: 81, ad: "Düzce", d: "M310,155 L328,148 L340,155 L336,168 L325,172 L310,165 Z" }
    ];

    // Path elementleri oluştur
    ilPaths.forEach(il => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", il.d);
        path.setAttribute("data-plaka", il.plaka);
        path.setAttribute("data-name", il.ad);

        // Renklendirme
        const ilData = illerData.find(x => x.ilId === il.plaka);
        if (ilData && ilData.hasOrganization) {
            path.classList.add("has-org");
        }

        // Hover tooltip
        path.addEventListener("mouseenter", function (e) {
            const tooltip = document.getElementById("mapTooltip");
            tooltip.textContent = il.ad;
            tooltip.style.display = "block";
        });

        path.addEventListener("mousemove", function (e) {
            const tooltip = document.getElementById("mapTooltip");
            const rect = container.getBoundingClientRect();
            tooltip.style.left = (e.clientX - rect.left + 10) + "px";
            tooltip.style.top = (e.clientY - rect.top - 30) + "px";
        });

        path.addEventListener("mouseleave", function () {
            document.getElementById("mapTooltip").style.display = "none";
        });

        // Click
        path.addEventListener("click", function () {
            if (onClickCallback) {
                onClickCallback(il.plaka, il.ad);
            }
        });

        svg.appendChild(path);
    });

    container.appendChild(svg);
}
