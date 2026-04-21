// Estilos para el panel de control
export const CONTROL_STYLES = {
  area: {
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    zIndex: 500,
  },
  statusText: {
    color: 'white',
    marginBottom: '10px',
    fontSize: '1.2em',
    minHeight: '1.5em',
  },
  micButton: {
    padding: '10px',
    marginTop: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    background: '#222222',
    border: 'none',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    fontSize: '1.5em',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  micButtonDisabled: {
    backgroundColor: '#555555',
    cursor: 'not-allowed',
  },
  micButtonEnabled: {
    backgroundColor: '#222222',
    cursor: 'pointer',
  },
};
