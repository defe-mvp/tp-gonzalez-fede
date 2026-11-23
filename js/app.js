/* =========================================================
   Buscador de Ubicaciones · Rick and Morty (variante B)
   Fetch con async/await, tarjetas con createElement,
   estados de carga/errores y persistencia en localStorage.
   ========================================================= */

const API_URL = "https://rickandmortyapi.com/api/location";
const CLAVE_STORAGE = "ultimaBusquedaUbicaciones";

const formulario = document.querySelector("#form-buscador");
const campoNombre = document.querySelector("#nombre");
const campoTipo = document.querySelector("#tipo");
const botonBuscar = document.querySelector("#boton-buscar");
const botonLimpiar = document.querySelector("#boton-limpiar");
const mensaje = document.querySelector("#mensaje");
const resultados = document.querySelector("#resultados");

/* ---------- Utilidades de datos ---------- */

// La API devuelve "" o "unknown" para datos faltantes: se muestra «Desconocido».
const normalizar = (valor) => {
  const texto = typeof valor === "string" ? valor.trim() : "";
  if (!texto || texto.toLowerCase() === "unknown") return "Desconocido";
  return texto;
};

const contarResidentes = (residentes) =>
  Array.isArray(residentes) ? residentes.length : 0;

/* ---------- URL de la petición ---------- */

const construirUrl = (nombre, tipo) => {
  const url = new URL(API_URL);
  if (nombre) url.searchParams.set("name", nombre);
  if (tipo) url.searchParams.set("type", tipo);
  return url;
};

/* ---------- Pedir datos ---------- */

const pedirUbicaciones = async (url) => {
  const respuesta = await fetch(url);

  // Sin coincidencias la API responde 404: no es un error de la página.
  if (respuesta.status === 404) {
    const sinResultados = new Error("Sin resultados");
    sinResultados.sinResultados = true;
    throw sinResultados;
  }
  if (!respuesta.ok) {
    throw new Error(`La API respondió ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  return Array.isArray(datos.results) ? datos.results : [];
};

/* ---------- Mensajes de estado ---------- */

const mostrarMensaje = (texto, tipo = "") => {
  mensaje.textContent = texto;
  mensaje.className = tipo ? `mensaje mensaje--${tipo}` : "mensaje";
};

const limpiarResultados = () => resultados.replaceChildren();

/* ---------- Tarjetas ---------- */

const crearTarjeta = (ubicacion) => {
  const tarjeta = document.createElement("article");
  tarjeta.className = "tarjeta";

  const cabecera = document.createElement("div");
  cabecera.className = "tarjeta__cabecera";

  const nombre = document.createElement("h2");
  nombre.className = "tarjeta__nombre";
  nombre.textContent = normalizar(ubicacion.name);

  const tipo = document.createElement("span");
  tipo.className = "tarjeta__tipo";
  tipo.textContent = normalizar(ubicacion.type);

  cabecera.append(nombre, tipo);

  const datos = document.createElement("div");
  datos.className = "tarjeta__datos";

  const filaDimension = document.createElement("p");
  filaDimension.className = "tarjeta__dato";

  const etiquetaDimension = document.createElement("span");
  etiquetaDimension.className = "tarjeta__etiqueta";
  etiquetaDimension.textContent = "Dimensión:";

  const valorDimension = document.createElement("span");
  valorDimension.className = "tarjeta__valor";
  valorDimension.textContent = normalizar(ubicacion.dimension);

  const filaResidentes = document.createElement("p");
  filaResidentes.className = "tarjeta__dato";

  const etiquetaResidentes = document.createElement("span");
  etiquetaResidentes.className = "tarjeta__etiqueta";
  etiquetaResidentes.textContent = "Residentes:";

  const valorResidentes = document.createElement("span");
  valorResidentes.className = "tarjeta__valor";
  valorResidentes.textContent = String(contarResidentes(ubicacion.residents));

  filaDimension.append(etiquetaDimension, valorDimension);
  filaResidentes.append(etiquetaResidentes, valorResidentes);
  datos.append(filaDimension, filaResidentes);
  tarjeta.append(cabecera, datos);

  return tarjeta;
};

const mostrarResultados = (lista) => {
  limpiarResultados();
  const tarjetas = lista.map(crearTarjeta);
  resultados.replaceChildren(...tarjetas);
};

/* ---------- Búsqueda ---------- */

const realizarBusqueda = async (nombre, tipo) => {
  mostrarMensaje("Buscando…", "cargando");
  botonBuscar.disabled = true;
  botonBuscar.textContent = "Buscando…";
  limpiarResultados();

  try {
    const lista = await pedirUbicaciones(construirUrl(nombre, tipo));

    if (lista.length === 0) {
      mostrarMensaje("Sin resultados para esa búsqueda.", "vacio");
      return;
    }

    mostrarResultados(lista);
    mostrarMensaje(`Se encontraron ${lista.length} ubicaciones (hasta 20 por página).`, "exito");
  } catch (error) {
    if (error.sinResultados) {
      mostrarMensaje("Sin resultados para esa búsqueda.", "vacio");
    } else {
      mostrarMensaje("Ocurrió un error al buscar. Revisá tu conexión e intentá de nuevo.", "error");
      console.warn("Fallo en la búsqueda:", error.message);
    }
  } finally {
    botonBuscar.disabled = false;
    botonBuscar.textContent = "Buscar";
  }
};

/* ---------- Persistencia ---------- */

const guardarBusqueda = (nombre, tipo) => {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify({ nombre, tipo }));
};

const recuperarBusqueda = () => {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_STORAGE));
    return guardado && typeof guardado === "object" ? guardado : null;
  } catch {
    return null;
  }
};

const olvidarBusqueda = () => localStorage.removeItem(CLAVE_STORAGE);

/* ---------- Eventos ---------- */

const manejarEnvio = (evento) => {
  evento.preventDefault();

  const nombre = campoNombre.value.trim();
  const tipo = campoTipo.value.trim();

  if (!nombre && !tipo) {
    limpiarResultados();
    mostrarMensaje("Escribí un nombre o un tipo de ubicación para buscar.", "aviso");
    return;
  }

  guardarBusqueda(nombre, tipo);
  realizarBusqueda(nombre, tipo);
};

const manejarLimpieza = () => {
  campoNombre.value = "";
  campoTipo.value = "";
  olvidarBusqueda();
  limpiarResultados();
  mostrarMensaje("Buscá una ubicación por nombre o por tipo.", "aviso");
  campoNombre.focus();
};

/* ---------- Arranque ---------- */

const criteriosDeLaUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return { nombre: params.get("nombre")?.trim() ?? "", tipo: params.get("tipo")?.trim() ?? "" };
};

const iniciar = () => {
  const desdeUrl = criteriosDeLaUrl();
  const hayCriteriosEnUrl = Boolean(desdeUrl.nombre || desdeUrl.tipo);
  const criterios = hayCriteriosEnUrl ? desdeUrl : recuperarBusqueda();

  if (!criterios || (!criterios.nombre && !criterios.tipo)) {
    mostrarMensaje("Buscá una ubicación por nombre o por tipo.", "aviso");
    return;
  }

  campoNombre.value = criterios.nombre ?? "";
  campoTipo.value = criterios.tipo ?? "";

  const nombre = campoNombre.value.trim();
  const tipo = campoTipo.value.trim();

  if (hayCriteriosEnUrl) guardarBusqueda(nombre, tipo);
  realizarBusqueda(nombre, tipo);
};

formulario.addEventListener("submit", manejarEnvio);
botonLimpiar.addEventListener("click", manejarLimpieza);

iniciar();
