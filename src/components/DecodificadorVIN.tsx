import { useState } from "react";
import type { FormEvent } from "react";
import "./DecodificadorVIN.css";

interface NhtsaVehicle {
  Make: string | null;
  Model: string | null;
  ModelYear: string | null;
  VehicleType: string | null;
  BodyClass: string | null;
  Trim: string | null;
  EngineCylinders: string | null;
  DisplacementL: string | null;
  FuelTypePrimary: string | null;
  DriveType: string | null;
  PlantCountry: string | null;
  ErrorText: string | null;
}

interface NhtsaResponse {
  Count: number;
  Message: string;
  SearchCriteria: string | null;
  Results: NhtsaVehicle[];
}

interface VehicleDetail {
  label: string;
  value: string;
}

const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;
const MODEL_YEAR_PATTERN = /^\d{4}$/;

function getDetail(value: string | null): string | null {
  if (!value || value === "0" || value.toLowerCase() === "not applicable") {
    return null;
  }

  return value;
}

function getVehicleDetails(vehicle: NhtsaVehicle): VehicleDetail[] {
  const fields: Array<[string, string | null]> = [
    ["Marca", vehicle.Make],
    ["Modelo", vehicle.Model],
    ["Año", vehicle.ModelYear],
    ["Tipo de vehículo", vehicle.VehicleType],
    ["Carrocería", vehicle.BodyClass],
    ["Versión", vehicle.Trim],
    ["Cilindros", vehicle.EngineCylinders],
    ["Cilindrada (L)", vehicle.DisplacementL],
    ["Combustible", vehicle.FuelTypePrimary],
    ["Tracción", vehicle.DriveType],
    ["País de fabricación", vehicle.PlantCountry],
  ];

  return fields.flatMap(([label, rawValue]) => {
    const value = getDetail(rawValue);
    return value ? [{ label, value }] : [];
  });
}

export default function DecodificadorVIN() {
  const [vin, setVin] = useState("");
  const [modelYear, setModelYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vehicle, setVehicle] = useState<NhtsaVehicle | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedVin = vin.trim().toUpperCase();
    if (!VIN_PATTERN.test(normalizedVin)) {
      setError("Ingresa un VIN válido de 17 caracteres. No se permiten las letras I, O ni Q.");
      setVehicle(null);
      setHasSearched(false);
      return;
    }

    if (modelYear && !MODEL_YEAR_PATTERN.test(modelYear)) {
      setError("Ingresa un año de modelo con cuatro dígitos.");
      setVehicle(null);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError("");
    setVehicle(null);
    setHasSearched(false);

    const url = new URL(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(normalizedVin)}`,
    );
    url.searchParams.set("format", "json");
    if (modelYear) {
      url.searchParams.set("modelyear", modelYear);
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("No fue posible consultar el servicio de NHTSA.");
      }

      const data: NhtsaResponse = await response.json();
      const firstVehicle = data.Results?.[0];
      const details = firstVehicle ? getVehicleDetails(firstVehicle) : [];

      setVehicle(details.length > 0 ? firstVehicle : null);
      setHasSearched(true);
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Ocurrió un error al consultar el VIN. Inténtalo nuevamente.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const details = vehicle ? getVehicleDetails(vehicle) : [];

  return (
    <section className="vin-decoder" aria-labelledby="vin-decoder-title">
      <div className="vin-decoder__intro">
        <span className="vin-decoder__eyebrow">Identificación del vehículo</span>
        <h2 id="vin-decoder-title">Decodificador VIN</h2>
        <p>Consulta la información disponible de tu auto usando su número de identificación.</p>
      </div>

      <form className="vin-decoder__form" onSubmit={handleSubmit} noValidate>
        <label className="vin-decoder__field vin-decoder__field--vin" htmlFor="vin-input">
          Número VIN
          <input
            id="vin-input"
            name="vin"
            type="text"
            value={vin}
            onChange={(event) => setVin(event.target.value.toUpperCase())}
            placeholder="Ej.: 1HGCM82633A004352"
            maxLength={17}
            autoComplete="off"
            aria-describedby="vin-help"
            required
          />
          <span id="vin-help" className="vin-decoder__hint">
            17 caracteres; no incluye I, O ni Q.
          </span>
        </label>

        <label className="vin-decoder__field vin-decoder__field--year" htmlFor="model-year-input">
          Año del modelo <span>(opcional)</span>
          <input
            id="model-year-input"
            name="modelyear"
            type="number"
            value={modelYear}
            onChange={(event) => setModelYear(event.target.value)}
            placeholder="Ej.: 2022"
            min={1981}
            max={2100}
            inputMode="numeric"
          />
        </label>

        <button className="vin-decoder__submit" type="submit" disabled={loading}>
          {loading ? "Consultando…" : "Consultar VIN"}
        </button>
      </form>

      {loading && (
        <p className="vin-decoder__notice" role="status">
          Buscando información del vehículo…
        </p>
      )}

      {error && (
        <p className="vin-decoder__notice vin-decoder__notice--error" role="alert">
          {error}
        </p>
      )}

      {hasSearched && !error && details.length === 0 && (
        <p className="vin-decoder__notice" role="status">
          No se encontraron datos para este VIN. Revisa el número e inténtalo de nuevo.
        </p>
      )}

      {vehicle && details.length > 0 && (
        <div className="vin-decoder__result" aria-live="polite">
          <div className="vin-decoder__result-heading">
            <div>
              <span className="vin-decoder__eyebrow">Resultado de la consulta</span>
              <h3>
                {[vehicle.ModelYear, vehicle.Make, vehicle.Model]
                  .map((part) => getDetail(part))
                  .filter(Boolean)
                  .join(" ") || "Datos del vehículo"}
              </h3>
            </div>
            <span className="vin-decoder__vin-badge">{vin.trim().toUpperCase()}</span>
          </div>
          <dl className="vin-decoder__details">
            {details.map(({ label, value }) => (
              <div className="vin-decoder__detail" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="vin-decoder__source">Información proporcionada por NHTSA vPIC.</p>
        </div>
      )}
    </section>
  );
}
