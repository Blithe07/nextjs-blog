declare global {
    namespace JSX {
      interface IntrinsicElements {
        'time': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>; // Normal web component
      }
    }
  }

declare module 'react-canvas-nest';