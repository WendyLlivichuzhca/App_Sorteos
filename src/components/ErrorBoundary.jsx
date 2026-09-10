import { Component } from "react";

// Sin esto, cualquier error de JavaScript durante el render (aunque sea uno
// chiquito) deja TODA la pagina en blanco, sin ningun mensaje — justo lo que
// le paso a un cliente real intentando pagar con tarjeta. Con este colchon,
// en vez de una pagina muerta, el usuario ve un mensaje y un boton para
// reintentar, y nosotros nos enteramos por la consola de que algo fallo.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hayError: false };
  }

  static getDerivedStateFromError() {
    return { hayError: true };
  }

  componentDidCatch(error, info) {
    console.error("Error atrapado por ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hayError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            padding: "24px",
            textAlign: "center",
            background: "#0B0F0D",
            color: "#F2F5F3",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1 style={{ fontSize: "20px", fontWeight: 800 }}>Algo salió mal</h1>
          <p style={{ fontSize: "14px", color: "#A9B3AD", maxWidth: "380px" }}>
            Ocurrió un error inesperado. Si estabas realizando una compra, no te preocupes: no se hizo ningún cobro que no hayas confirmado. Intenta de nuevo o contáctanos si el problema sigue.
          </p>
          <button
            type="button"
            onClick={() => window.location.assign("/")}
            style={{
              background: "linear-gradient(135deg, #22A06A, #146B45)",
              color: "#fff",
              border: "none",
              borderRadius: "50px",
              padding: "11px 24px",
              fontSize: "13.5px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Volver al inicio
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
