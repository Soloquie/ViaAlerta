// Tipos mínimos de supertest usados en las pruebas.
// Si instalas @types/supertest (npm i -D @types/supertest) puedes borrar este archivo.
declare module 'supertest' {
  import type { Server } from 'node:http';

  interface Respuesta {
    status: number;
    body: any;
    headers: Record<string, string>;
    text: string;
  }

  interface Prueba extends PromiseLike<Respuesta> {
    set(campo: string, valor: string): Prueba;
    send(datos?: unknown): Prueba;
    query(datos: Record<string, unknown>): Prueba;
    field(nombre: string, valor: string): Prueba;
    attach(campo: string, archivo: Buffer, opciones?: { filename?: string; contentType?: string }): Prueba;
    expect(estado: number): Prueba;
  }

  interface Agente {
    get(url: string): Prueba;
    post(url: string): Prueba;
    put(url: string): Prueba;
    patch(url: string): Prueba;
    delete(url: string): Prueba;
  }

  function request(app: unknown | Server): Agente;
  export default request;
}
