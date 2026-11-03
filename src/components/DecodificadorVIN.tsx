import { useState, type FormEvent } from 'react'
import './DecodificadorVIN.css'

interface AutoApi {
  Make: string | null
  Model: string | null
  ModelYear: string | null
  VehicleType: string | null
  BodyClass: string | null
  FuelTypePrimary: string | null
  DriveType: string | null
}

interface RespuestaApi {
  Results: AutoApi[]
}

interface DatoAuto {
  nombre: string
  valor: string
}

const patronVin = /^[A-HJ-NPR-Z0-9]{17}$/

function limpiarDato(dato: string | null) {
  if (!dato || dato === '0' || dato.toLowerCase() === 'not applicable') {
    return ''
  }

  return dato
}

function obtenerDatos(auto: AutoApi): DatoAuto[] {
  const datos = [
    { nombre: 'Marca', valor: limpiarDato(auto.Make) },
    { nombre: 'Modelo', valor: limpiarDato(auto.Model) },
    { nombre: 'Año', valor: limpiarDato(auto.ModelYear) },
    { nombre: 'Tipo de vehículo', valor: limpiarDato(auto.VehicleType) },
    { nombre: 'Carrocería', valor: limpiarDato(auto.BodyClass) },
    { nombre: 'Combustible', valor: limpiarDato(auto.FuelTypePrimary) },
    { nombre: 'Tracción', valor: limpiarDato(auto.DriveType) },
  ]

  return datos.filter((dato) => dato.valor !== '')
}

export default function DecodificadorVIN() {
  const [numeroVin, setNumeroVin] = useState('')
  const [anioModelo, setAnioModelo] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [auto, setAuto] = useState<AutoApi | null>(null)
  const [consultaRealizada, setConsultaRealizada] = useState(false)

  async function consultarAuto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    const vinNormalizado = numeroVin.trim().toUpperCase()
    if (!patronVin.test(vinNormalizado)) {
      setError('Ingresa un VIN de 17 caracteres. No se permiten las letras I, O ni Q.')
      setAuto(null)
      setConsultaRealizada(false)
      return
    }

    if (
      anioModelo &&
      (!/^\d{4}$/.test(anioModelo) || Number(anioModelo) < 1981 || Number(anioModelo) > 2100)
    ) {
      setError('Ingresa un año de modelo válido de cuatro dígitos.')
      setAuto(null)
      setConsultaRealizada(false)
      return
    }

    setCargando(true)
    setError('')
    setAuto(null)
    setConsultaRealizada(false)

    const url = new URL(
      'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/' +
        encodeURIComponent(vinNormalizado),
    )
    url.searchParams.set('format', 'json')

    if (anioModelo) {
      url.searchParams.set('modelyear', anioModelo)
    }

    try {
      const respuesta = await fetch(url)
      if (!respuesta.ok) {
        throw new Error('No se pudo consultar la información del auto.')
      }

      const datos: RespuestaApi = await respuesta.json()
      const resultado = datos.Results?.[0]
      setAuto(resultado && obtenerDatos(resultado).length > 0 ? resultado : null)
      setConsultaRealizada(true)
    } catch {
      setError('Ocurrió un error al consultar el VIN. Inténtalo de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  const datosAuto = auto ? obtenerDatos(auto) : []
  const tituloAuto = auto
    ? [limpiarDato(auto.ModelYear), limpiarDato(auto.Make), limpiarDato(auto.Model)]
        .filter(Boolean)
        .join(' ')
    : ''

  return (
    <section className="decodificador" aria-labelledby="titulo-decodificador">
      <div className="decodificador__introduccion">
        <p className="decodificador__etiqueta">Consulta de auto</p>
        <h2 id="titulo-decodificador">Decodificador VIN</h2>
        <p>Ingresa el VIN para ver los datos disponibles del vehículo.</p>
      </div>

      <form className="decodificador__formulario" onSubmit={consultarAuto} noValidate>
        <label className="decodificador__campo" htmlFor="numero-vin">
          VIN
          <input
            id="numero-vin"
            type="text"
            value={numeroVin}
            onChange={(evento) => setNumeroVin(evento.target.value.toUpperCase())}
            placeholder="17 caracteres"
            maxLength={17}
            autoComplete="off"
            aria-describedby="ayuda-vin"
          />
          <span id="ayuda-vin">No uses las letras I, O ni Q.</span>
        </label>

        <label className="decodificador__campo" htmlFor="anio-modelo">
          Año del modelo <span>(opcional)</span>
          <input
            id="anio-modelo"
            type="number"
            value={anioModelo}
            onChange={(evento) => setAnioModelo(evento.target.value)}
            placeholder="Ej.: 2022"
            min={1981}
            max={2100}
          />
        </label>

        <button className="decodificador__boton" type="submit" disabled={cargando}>
          {cargando ? 'Consultando...' : 'Consultar'}
        </button>
      </form>

      {cargando && <p className="decodificador__mensaje" role="status">Buscando información...</p>}
      {error && <p className="decodificador__error" role="alert">{error}</p>}
      {consultaRealizada && !error && !auto && (
        <p className="decodificador__mensaje" role="status">
          No se encontraron datos para este VIN.
        </p>
      )}

      {auto && (
        <div className="decodificador__resultado" aria-live="polite">
          <h3>{tituloAuto || 'Datos del vehículo'}</h3>
          <dl>
            {datosAuto.map((dato) => (
              <div className="decodificador__dato" key={dato.nombre}>
                <dt>{dato.nombre}</dt>
                <dd>{dato.valor}</dd>
              </div>
            ))}
          </dl>
          <p>Información proporcionada por NHTSA vPIC.</p>
        </div>
      )}
    </section>
  )
}
