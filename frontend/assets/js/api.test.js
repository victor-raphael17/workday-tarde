import { strict as assert } from 'node:assert';
import { test } from 'node:test';

//mock fetch global 

global.fetch = async (url, options) => {
    return {
        ok : true,
        status : 200,
        json : async () => ({data: {id: 1, nome: 'teste'}})
    };

};

//mock do window.localStorage 

global.window = {
    localStorage : {
        getItem : () => null, setItem : () => {}, removeItem : () => {} 
   },
   sessionStorage : {
    getItem : () => null, setItem : () => {}, removeItem : () => {} 
   },
   location : {
    replace : () => {}
   },
   __API_BASE__: 'http://localhost:8080',
};

const { ApiError } = await import('./api.js');

//teste 1

test ("desempacota o envelope com suscesso", async () => {
    global.fetch = async () => ({
        ok : true,
        status : 200,
        json : async () => ({data: {id: 1, nome: 'teste'} }),
    });


const {api} = await import('./api.js');
const resultado = await api.medication(1);

assert.deepEqual(resultado, {id: 1, nome: 'teste'});
});

//teste 2

test("lanca ApiError com status e mensagem do envelope de erro", async () => {
    global.fetch = async () => ({
        ok: false,
        status: 404,
        json: async () => ({ error: { status: 404, message: "Not found" } }),
    });

    const { api } = await import("./api.js");

    await assert.rejects(
        () => api.medication(99),
        (err) => {
            assert.ok(err instanceof ApiError);
            assert.equal(err.status, 404);
            assert.equal(err.message, "Not found");
            return true;
        }
    );
});

// -----------------------------------------------------------
// Teste 3: erro de rede (fetch lanca excecao)
// -----------------------------------------------------------
test("lanca ApiError com status 0 quando API esta fora", async () => {
    global.fetch = async () => { throw new Error("network fail"); };

    const { api } = await import("./api.js");

    await assert.rejects(
        () => api.medication(1),
        (err) => {
            assert.ok(err instanceof ApiError);
            assert.equal(err.status, 0);
            return true;
        }
    );
});