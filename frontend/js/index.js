/**
 * Script de la página de inicio
 * Carga y renderiza carousels de aves destacadas, lugares y estadísticas
 */

/**
 * Escapa texto para uso seguro en HTML
 * @param {*} s - Texto a escapar
 * @returns {string} Texto escapado
 */
const escapeText = (s) => (s === null || s === undefined) ? '' : String(s);

/**
 * Convierte texto a slug URL-friendly
 * @param {*} value - Texto a convertir
 * @returns {string} Slug normalizado
 */
const slugify = (value) => {
	if (value === null || value === undefined) return '';
	return String(value)
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-');
};

/**
 * Carga tarjetas mini de especies aleatorias para el carousel
 */
async function loadSpeciesMiniCards() {
	const container = document.getElementById('index-carousel');
	if (!container) return;

	try {
		const data = await api.route('catalogo');
		const aves = (data && data.aves) ? data.aves : [];
		if (!aves.length) {
			container.textContent = 'No hay especies disponibles.';
			return;
		}

		const pick = [];
		const max = Math.min(2, aves.length);
		while (pick.length < max) {
			const candidate = aves[Math.floor(Math.random() * aves.length)];
			if (!pick.includes(candidate)) pick.push(candidate);
		}

		pick.forEach((ave) => {
			const card = document.createElement('div');
			card.className = 'carousel-card';

			const link = document.createElement('a');
			link.href = `/pages/catalogo.html#modalAve${ave.id}`;
			link.title = escapeText(ave.nombre_comun || ave.nombre_cientifico || 'Ver ficha');

			const img = document.createElement('img');
			img.src = ave.imagen || '/img/Aves/accipiter_nisus.jpg';
			img.alt = escapeText(ave.nombre_comun || ave.nombre_cientifico || 'Ave');

			const h4 = document.createElement('h4');
			h4.textContent = escapeText(ave.nombre_comun || ave.nombre_cientifico || 'Sin nombre');

			link.appendChild(img);
			link.appendChild(h4);
			card.appendChild(link);
			container.appendChild(card);
		});
	} catch (err) {
	  console.error('Error cargando aves para el carousel:', err);
	  container.innerHTML = '';
	  const msg = document.createElement('div');
	  msg.className = 'text-muted mb-2';
	  msg.textContent = 'No se pudieron cargar aves destacadas.';
	  const retry = document.createElement('button');
	  retry.className = 'btn btn-sm btn-link';
	  retry.textContent = 'Reintentar';
	  retry.addEventListener('click', () => location.reload());
	  container.appendChild(msg);
	  container.appendChild(retry);
	}
}
/**
 * Carga carousel de aves aleatorias para la sección principal
 */
async function loadAvesCarousel() {
	const root = document.getElementById('aves-carousel-root');
	if (!root) return;

	try {
		const data = await api.route('catalogo');
		const aves = data && data.aves ? data.aves : [];
		if (!aves.length) {
			root.textContent = 'No hay aves para mostrar.';
			return;
		}

				const pool = aves.slice();
		const selected = [];
		while (selected.length < 3 && pool.length) {
			const i = Math.floor(Math.random() * pool.length);
			selected.push(pool.splice(i, 1)[0]);
		}

		const carouselId = 'avesCarousel';
		const indicators = selected.map((_, idx) => `
			<button type="button" data-bs-target="#${carouselId}" data-bs-slide-to="${idx}" ${idx === 0 ? 'class="active" aria-current="true"' : ''} aria-label="Slide ${idx + 1}"></button>
		`).join('');

		const items = selected.map((ave, idx) => {
			const title = escapeText(ave.nombre_comun || ave.nombre_cientifico || 'Sin nombre');
			const img = escapeText(ave.imagen || '/img/Aves/accipiter_nisus.jpg');
			return `
				<div class="carousel-item${idx === 0 ? ' active' : ''}">
					<div class="text-center py-3">
						<a href="/pages/catalogo.html#modalAve${ave.id}">
							<img src="${img}" class="aves-home-img mx-auto d-block" alt="${title}">
						</a>
						<div class="mt-2"><h5>${title}</h5></div>
					</div>
				</div>
			`;
		}).join('');

		root.innerHTML = `
			<div id="${carouselId}" class="carousel slide" data-bs-ride="carousel">
				<div class="carousel-inner">${items}</div>
				<div class="carousel-indicators">${indicators}</div>
				<button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
					<span class="carousel-control-prev-icon" aria-hidden="true"></span>
					<span class="visually-hidden">Anterior</span>
				</button>
				<button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
					<span class="carousel-control-next-icon" aria-hidden="true"></span>
					<span class="visually-hidden">Siguiente</span>
				</button>
			</div>
		`;
	} catch (err) {
	  console.error('Error cargando carousel de aves:', err);
	  root.innerHTML = '';
	  const msg = document.createElement('div');
	  msg.className = 'text-muted mb-2';
	  msg.textContent = 'No se pudieron cargar las aves.';
	  const retry = document.createElement('button');
	  retry.className = 'btn btn-sm btn-link';
	  retry.textContent = 'Reintentar';
	  retry.addEventListener('click', () => location.reload());
	  root.appendChild(msg);
	  root.appendChild(retry);
	}
}
/**
 * Carga carousel de lugares destacados (parques, centros, jardines)
 */
async function loadLugaresCarousel() {
	const root = document.getElementById('lugares-carousel-root');
	if (!root) return;

	try {
		const data = await api.route('comoContribuir');
		const lugares = data && data.lugares ? data.lugares : [];
		if (!lugares.length) {
			root.textContent = 'No hay lugares disponibles.';
			return;
		}

		const nameMatches = (lugar) => {
			const name = (lugar.nombre || '').toLowerCase();
			return {
				isCentro: /centro|consorcio/i.test(name),
				isJardin: /jardines/i.test(name),
				isParque: /parc|paratge|reserva|monument/i.test(name)
			};
		};

		let parkIndex = lugares.findIndex(l => nameMatches(l).isParque);
		let centroIndex = lugares.findIndex(l => nameMatches(l).isCentro);
		let jardinIndex = lugares.findIndex(l => nameMatches(l).isJardin);

		const chosen = new Set();
		const selected = [];
		const pushIfValid = (idx) => {
			if (idx >= 0 && !chosen.has(idx)) {
				chosen.add(idx);
				selected.push({ lugar: lugares[idx], index: idx });
			}
		};

		pushIfValid(parkIndex);
		pushIfValid(centroIndex);
		pushIfValid(jardinIndex);

		for (let i = 0; i < lugares.length && selected.length < 3; i++) {
			if (!chosen.has(i)) pushIfValid(i);
		}

		if (!selected.length) {
			root.textContent = 'No hay lugares suficientes para mostrar.';
			return;
		}

		const carouselId = 'lugaresCarousel';
		const indicators = selected.map((_, idx) => `
			<button type="button" data-bs-target="#${carouselId}" data-bs-slide-to="${idx}" ${idx === 0 ? 'class="active" aria-current="true"' : ''} aria-label="Slide ${idx + 1}"></button>
		`).join('');

		const items = selected.map(({ lugar, index }, idx) => {
			const slugId = lugar.id ? `lugar-${slugify(lugar.id)}` : `lugar-${slugify(lugar.nombre)}-${index}`;
			const href = `/pages/como-contribuir.html#${slugId}`;
			const img = escapeText(lugar.imagen || '/img/Lugares/ParcNaturaldeMondrago.jpg');
			const title = escapeText(lugar.nombre || '');
			const desc = escapeText((lugar.descripcion || '').slice(0, 180));

			return `
				<div class="carousel-item${idx === 0 ? ' active' : ''}">
					<div class="card mb-3 border-0">
						<div class="row g-0 align-items-center">
							<div class="col-md-6">
								<a href="${href}" class="d-block">
									<img src="${img}" class="img-fluid w-100" alt="${title}">
								</a>
							</div>
							<div class="col-md-6">
								<div class="card-body">
									<h5 class="card-title">${title}</h5>
									<p class="card-text text-muted">${desc}${(lugar.descripcion && lugar.descripcion.length > 180) ? '…' : ''}</p>
									<a href="${href}" class="btn btn-sm btn-primary">Ver en Cómo Contribuir</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			`;
		}).join('');

		root.innerHTML = `
			<div id="${carouselId}" class="carousel slide" data-bs-ride="carousel">
				<div class="carousel-inner">${items}</div>
				<div class="carousel-indicators">${indicators}</div>
				<button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
					<span class="carousel-control-prev-icon" aria-hidden="true"></span>
					<span class="visually-hidden">Anterior</span>
				</button>
				<button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
					<span class="carousel-control-next-icon" aria-hidden="true"></span>
					<span class="visually-hidden">Siguiente</span>
				</button>
			</div>
		`;

		} catch (err) {
			console.error('Error cargando lugares para el carousel:', err);
			root.innerHTML = '';
			const msg = document.createElement('div');
			msg.className = 'text-muted mb-2';
			msg.textContent = 'No se pudieron cargar los lugares destacados.';
			const retry = document.createElement('button');
			retry.className = 'btn btn-sm btn-link';
			retry.textContent = 'Reintentar';
			retry.addEventListener('click', () => location.reload());
			root.appendChild(msg);
			root.appendChild(retry);
		}
}
/**
 * Carga y actualiza los contadores de estadísticas (especies, parques, etc.)
 */
async function loadCounts() {
	const speciesEl = document.getElementById('speciesCount');
	const parquesEl = document.getElementById('parquesCount');
	const jardinesEl = document.getElementById('jardinesCount');
	const centrosEl = document.getElementById('centrosCount');

	try {
		const sobre = await api.route('sobreNosotros');
		const stats = sobre && sobre.stats ? sobre.stats : {};
		if (speciesEl) {
			if (typeof stats.total_especies === 'number') {
				speciesEl.textContent = String(stats.total_especies);
			} else if (typeof stats.especies === 'number') {
				speciesEl.textContent = String(stats.especies);
			} else {
				speciesEl.textContent = 'N/A';
			}
		}
	} catch (err) {
		console.warn('No se pudo obtener recuento de especies:', err);
		if (speciesEl) speciesEl.textContent = 'N/A';
	}

	try {
		const data = await api.route('comoContribuir');
		const lugares = data && data.lugares ? data.lugares : [];
		const nameMatches = (lugar) => {
			const name = (lugar.nombre || '').toLowerCase();
			return {
				isCentro: /centro|consorcio/i.test(name),
				isJardin: /jardines/i.test(name),
				isParque: /parc|paratge|reserva|monument/i.test(name)
			};
		};

		const parques = lugares.filter(l => nameMatches(l).isParque).length;
		const jardines = lugares.filter(l => nameMatches(l).isJardin).length;
		const centros = lugares.filter(l => nameMatches(l).isCentro).length;

		if (parquesEl) parquesEl.textContent = String(parques || 0);
		if (jardinesEl) jardinesEl.textContent = String(jardines || 0);
		if (centrosEl) centrosEl.textContent = String(centros || 0);
	} catch (err) {
		console.warn('No se pudo obtener recuento de lugares:', err);
		if (parquesEl) parquesEl.textContent = 'N/A';
		if (jardinesEl) jardinesEl.textContent = 'N/A';
		if (centrosEl) centrosEl.textContent = 'N/A';
	}
}
// Inicializar todos los carousels y estadísticas al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
	loadSpeciesMiniCards();
	loadAvesCarousel();
	loadLugaresCarousel();
	loadCounts();
});

