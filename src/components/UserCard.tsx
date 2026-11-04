import { useState, type FC, type MouseEvent } from 'react'

export interface UserProps {
  name: string
  age: number
  isStudent: boolean
}

const UserCard: FC<UserProps> = ({ name, age, isStudent }) => {
  const [mensaje, setMensaje] = useState('')

  function saludar(evento: MouseEvent<HTMLButtonElement>) {
    setMensaje(`Hola, ${evento.currentTarget.dataset.nombre}`)
  }

  return (
    <article className="tarjeta-usuario">
      <h2 className="tarjeta-usuario__nombre">{name}</h2>
      <p>Edad: {age}</p>
      <p>Estudiante: {isStudent ? 'Sí' : 'No'}</p>
      <button
        className="tarjeta-usuario__boton"
        type="button"
        data-nombre={name}
        onClick={saludar}
      >
        Saludar
      </button>
      {mensaje && <p role="status">{mensaje}</p>}
    </article>
  )
}

export default UserCard

