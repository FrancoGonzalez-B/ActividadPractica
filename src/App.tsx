import { CatalogoAutos } from './components/CatalogoAutos'
import DecodificadorVIN from './components/DecodificadorVIN'
import UserCard from './components/UserCard'
import './App.css'

function App() {
  return (
    <main className="pagina">
      <header className="encabezado">
        <p className="etiqueta">Catálogo</p>
        <h1>Autos</h1>
        <p>Busca modelos por marca o consulta un auto con su VIN.</p>
      </header>

      <CatalogoAutos />
      <DecodificadorVIN />

      <section className="ejercicio-typescript">
        <h2>Ejercicio TypeScript</h2>
        <UserCard name="Franco" age={20} isStudent={true} />
      </section>

      <footer className="pie">
        <p>Información de marcas y modelos consultada en línea.</p>
      </footer>
    </main>
  )
}

export default App
