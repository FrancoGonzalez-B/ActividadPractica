import { useEffect, useState, type ChangeEvent } from 'react'
import './CatalogoAutos.css'

interface MarcaApi {
  Make_ID: number
  Make_Name: string
}

interface ModeloApi {
  Make_ID: number
  Make_Name: string
  Model_ID: number
  Model_Name: string
}

interface Marca {
  id: number
  nombre: string
}

interface Modelo {
  id: number
  nombre: string
}

interface RespuestaApi<T> {
  Results: T[]
}

export function CatalogoAutos() {
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [marcaElegida, setMarcaElegida] = useState('')
  const [cargandoMarcas, setCargandoMarcas] = useState(true)
  const [cargandoModelos, setCargandoModelos] = useState(false)
  const [errorMarcas, setErrorMarcas] = useState('')
  const [errorModelos, setErrorModelos] = useState('')

  useEffect(() => {
    async function cargarMarcas() {
      try {
        const respuesta = await fetch(
          'https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json',
        )

        if (!respuesta.ok) {
          throw new Error('No se pudieron cargar las marcas.')
        }

        const datos: RespuestaApi<MarcaApi> = await respuesta.json()
        const lista = (datos.Results ?? []).map((marca) => ({
          id: marca.Make_ID,
          nombre: marca.Make_Name,
        }))
        lista.sort((a, b) => a.nombre.localeCompare(b.nombre))
        setMarcas(lista)
      } catch {
        setErrorMarcas('No se pudieron cargar las marcas. Intenta de nuevo más tarde.')
      } finally {
        setCargandoMarcas(false)
      }
    }

    void cargarMarcas()
  }, [])

  async function elegirMarca(evento: ChangeEvent<HTMLSelectElement>) {
    const nombre = evento.target.value
    const marca = marcas.find((opcion) => opcion.nombre === nombre)
    setMarcaElegida(nombre)
    setModelos([])
    setErrorModelos('')

    if (!marca) {
      return
    }

    setCargandoModelos(true)

    try {
      const respuesta = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeId/${marca.id}?format=json`,
      )

      if (!respuesta.ok) {
        throw new Error('No se pudieron cargar los modelos.')
      }

      const datos: RespuestaApi<ModeloApi> = await respuesta.json()
      setModelos(
        (datos.Results ?? []).map((modelo) => ({
          id: modelo.Model_ID,
          nombre: modelo.Model_Name,
        })),
      )
    } catch {
      setErrorModelos('No se pudieron cargar los modelos. Intenta de nuevo más tarde.')
    } finally {
      setCargandoModelos(false)
    }
  }

  return (
    <section className="catalogo">
      <label className="catalogo__rotulo" htmlFor="marca">
        Marca del auto
      </label>

      {cargandoMarcas && <p className="catalogo__mensaje">Cargando marcas...</p>}
      {errorMarcas && <p className="catalogo__error" role="alert">{errorMarcas}</p>}

      {!cargandoMarcas && !errorMarcas && (
        <select
          className="catalogo__selector"
          id="marca"
          value={marcaElegida}
          onChange={elegirMarca}
        >
          <option value="">Selecciona una marca</option>
          {marcas.map((marca) => (
            <option key={marca.id} value={marca.nombre}>
              {marca.nombre}
            </option>
          ))}
        </select>
      )}

      {marcaElegida && (
        <div className="catalogo__modelos" aria-live="polite">
          <h2>Modelos {marcaElegida}</h2>
          {cargandoModelos && <p className="catalogo__mensaje">Cargando modelos...</p>}
          {errorModelos && <p className="catalogo__error" role="alert">{errorModelos}</p>}
          {!cargandoModelos && !errorModelos && modelos.length === 0 && (
            <p className="catalogo__mensaje">No hay modelos para mostrar.</p>
          )}
          {!cargandoModelos && modelos.length > 0 && (
            <ul className="catalogo__lista">
              {modelos.map((modelo) => (
                <li key={modelo.id}>{modelo.nombre}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
