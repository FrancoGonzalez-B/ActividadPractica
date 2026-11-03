import { CatalogoAutos } from './components/CatalogoAutos'
import './App.css'

function App() {
  return (
    <main className="pagina">
      <header className="encabezado">
        <p className="etiqueta">Catálogo</p>
        <h1>Autos</h1>
        <p>Elige una marca para ver sus modelos.</p>
      </header>

      <CatalogoAutos />

      <footer className="pie">
        <p>Información de marcas y modelos consultada en línea.</p>
      </footer>
    </main>
  )
}

export default App
