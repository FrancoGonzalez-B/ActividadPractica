import { useState, type FormEvent } from 'react'
import './CatalogoAutos.css'

interface MarcaApi {
  MakeId: number
  MakeName: string
}

interface ModeloApi {
  Make_Name: string
  Model_ID: number
  Model_Name: string
}

interface RespuestaApi<T> {
  Results: T[]
}

interface Auto {
  id: number
  marca: string
  modelo: string
}

function normalizar(texto: string) {
  return texto.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function CatalogoAutos() {
  const [busqueda, setBusqueda] = useState('')
  const [autos, setAutos] = useState<Auto[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [consultaRealizada, setConsultaRealizada] = useState(false)

  async function buscarAuto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    const texto = busqueda.trim()
    if (!texto) {
      setError('Escribe la marca o el modelo del auto.')
      setAutos([])
      setConsultaRealizada(false)
      return
    }

    setCargando(true)
    setError('')
    setAutos([])
    setConsultaRealizada(false)

    try {
      const respuestaMarcas = await fetch(
        'https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json',
      )
      if (!respuestaMarcas.ok) {
        throw new Error('No se pudieron cargar las marcas.')
      }

      const datosMarcas: RespuestaApi<MarcaApi> = await respuestaMarcas.json()
      const busquedaNormalizada = normalizar(texto)
      const marca = (datosMarcas.Results ?? [])
        .filter((opcion) => busquedaNormalizada.startsWith(normalizar(opcion.MakeName)))
        .sort((a, b) => b.MakeName.length - a.MakeName.length)[0]

      if (!marca) {
        setAutos([])
        setConsultaRealizada(true)
        return
      }

      const nombreModelo = texto.slice(marca.MakeName.length).trim()
      const respuestaModelos = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeId/${marca.MakeId}?format=json`,
      )
      if (!respuestaModelos.ok) {
        throw new Error('No se pudieron cargar los modelos.')
      }

      const datosModelos: RespuestaApi<ModeloApi> = await respuestaModelos.json()
      const modeloBuscado = normalizar(nombreModelo.replace(/\b(19|20)\d{2}\b/g, ' '))
      const encontrados = (datosModelos.Results ?? [])
        .filter((modelo) => !modeloBuscado || normalizar(modelo.Model_Name).includes(modeloBuscado))
        .slice(0, 20)
        .map((modelo) => ({
          id: modelo.Model_ID,
          marca: modelo.Make_Name,
          modelo: modelo.Model_Name,
        }))

      setAutos(encontrados)
      setConsultaRealizada(true)
    } catch {
      setError('No se pudo consultar la información. Intenta de nuevo más tarde.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <section className="catalogo">
      <div className="catalogo__introduccion">
        <h2>Buscar auto por nombre</h2>
        <p>Escribe la marca y, si quieres, el modelo. Por ejemplo: Toyota Corolla.</p>
      </div>

      <form className="catalogo__formulario" onSubmit={buscarAuto}>
        <label className="catalogo__rotulo" htmlFor="nombre-auto">
          Marca y modelo
          <input
            className="catalogo__entrada"
            id="nombre-auto"
            type="text"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Ej.: Toyota Corolla"
            autoComplete="off"
          />
        </label>
        <button className="catalogo__boton" type="submit" disabled={cargando}>
          {cargando ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {cargando && <p className="catalogo__mensaje" role="status">Buscando autos...</p>}
      {error && <p className="catalogo__error" role="alert">{error}</p>}
      {consultaRealizada && !error && autos.length === 0 && (
        <p className="catalogo__mensaje" role="status">
          No se encontraron autos. Prueba escribiendo primero la marca, por ejemplo: Honda Civic.
        </p>
      )}

      {autos.length > 0 && (
        <div className="catalogo__modelos" aria-live="polite">
          <h3>Autos encontrados</h3>
          <ul className="catalogo__lista">
            {autos.map((auto) => (
              <li key={`${auto.id}-${auto.marca}-${auto.modelo}`}>
                <strong>{auto.marca}</strong> {auto.modelo}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

