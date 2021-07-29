#!/usr/bin/env node

const HV = Number.MAX_SAFE_INTEGER;

// constantes:
// TODO buscar todoooos estos valores.
const IAD_SV = 90; // Intervalo entre aplicacion de primer y segunda dosis SV
const IAD_AZ = 56; // Intervalo entre aplicacion de primer y segunda dosis AZ
const IAD_SI = 21; // Intervalo entre aplicacion de primer y segunda dosis SI
const FACTOR_R = 1.2; // Cantidad de gente que tiene contacto estrecho con contagiados y son posbiles nuevos contagiados.
const POBLACION = 45000000;
const EF_1SV = 0.7; // Efectividad de la primera dosis de SV de no contraer la enfermedad
const EF_2SV = 0.8; // Efectividad de la segunda dosis de SV de no contraer la enfermedad
const EF_1AZ = 0.7; // Efectividad de la primera dosis de AZ de no contraer la enfermedad
const EF_2AZ = 0.8; // Efectividad de la segunda dosis de AZ de no contraer la enfermedad
const EF_1SI = 0.7; // Efectividad de la primera dosis de SI de no contraer la enfermedad
const EF_2SI = 0.8; // Efectividad de la segunda dosis de SI de no contraer la enfermedad
const EF_NV = 0.1; // "Efectividad" (probabilidad) de no contraer la enfermedad al ser contracto estrecho


// ------- Variables -------

// -- Control: --

// TODO armar scnearios
const PAPD_1SV = 1 / 6; // Porcentaje a aplicar por día de primera dosis de vacuna SV
const PAPD_2SV = 1 / 6; // Porcentaje a aplicar por día de segunda dosis de vacuna SV // TODO tal vez esto no sea necesario? en realidad hay que ver porque tenemos unlimite...
const PAPD_1AZ = 1 / 6; // Porcentaje a aplicar por día de primera dosis de vacuna AZ
const PAPD_2AZ = 1 / 6; // Porcentaje a aplicar por día de segunda dosis de vacuna AZ // TODO tal vez esto no sea necesario?
const PAPD_1SI = 1 / 6; // Porcentaje a aplicar por día de primera dosis de vacuna SI
const PAPD_2SI = 1 / 6; // Porcentaje a aplicar por día de segunda dosis de vacuna SI // TODO tal vez esto no sea necesario?

if ((PAPD_1SV + PAPD_2SV + PAPD_1AZ + PAPD_2AZ + PAPD_1SI + PAPD_2SI).toFixed(4) !== "1.0000") {
    throw "Configuracion invalida, la sumatoria de porcentajes a aplicar debe ser 1.";
}


// -- Datos: --

// Intervalo entre arrivos de stock de dosis de primera dosis de vacuna SV
function IA_1SV() {
    let R = Math.random();
    // f(R) = 2.0113/((1/R-1)^(1/7.0000))+7.0000
    return Math.round(2.0113 / ((1 / R - 1) ** (1 / 7)) + 7);
}

// Intervalo entre arrivos de stock de dosis de segunda dosis de vacuna SV
function IA_2SV() {
    let R = Math.random();
    // f(R) = R*(50.0000-2.0000)+2.0000
    return Math.round(R * (50 - 2) + 2);
}

// Intervalo entre arrivos de stock de dosis de primera dosis de vacuna AZ
function IA_1AZ() {
    let R = Math.random();
    // f(R) = 2.0046/((1/R-1)^(1/7.0000))+7.0000
    return Math.round(2.0046 / ((1 / R - 1) ** (1 / 7)) + 7);
}

// Intervalo entre arrivos de stock de dosis de segunda dosis de vacuna AZ
function IA_2AZ() {
    // TODO buscar fdp
    return 15;
}

// Intervalo entre arrivos de stock de dosis de primera dosis de vacuna SI
function IA_1SI() {
    // TODO buscar fdp
    return 15;
}

// Intervalo entre arrivos de stock de dosis de segunda dosis de vacuna SI
function IA_2SI() {
    // TODO buscar fdp
    return 15;
}


// Cantidad de dosis recibidas de primera dosis de vacuna SV cada IA_1SV días
function CDR_1SV() {
    // TODO buscar fdp
    return 1;
}

// Cantidad de dosis recibidas de segunda dosis de vacuna SV cada IA_2SV días
function CDR_2SV() {
    // TODO buscar fdp
    return 1;
}

// Cantidad de dosis recibidas de primera dosis de vacuna AZ cada IA_1AZ días
function CDR_1AZ() {
    // TODO buscar fdp
    return 1;
}

// Cantidad de dosis recibidas de segunda dosis de vacuna AZ cada IA_2AZ días
function CDR_2AZ() {
    // TODO buscar fdp
    return 1;
}

// Cantidad de dosis recibidas de primera dosis de vacuna SI cada IA_1SI días
function CDR_1SI() {
    // TODO buscar fdp
    return 1;
}

// Cantidad de dosis recibidas de segunda dosis de vacuna SI cada IA_2SI días
function CDR_2SI() {
    // TODO buscar fdp
    return 1;
}

// Cantidad máxima de dosis a aplicar por día
function CMDPD() {
    // TODO buscar fdp
    return 4000;
}

// -- Estado: --

let ST_1SV = 0;     // Stock de primera dosis vacuna SV
let ST_2SV = 0;     // Stock de segunda dosis vacuna SV
let ST_1AZ = 0;     // Stock de primera dosis vacuna AZ
let ST_2AZ = 0;     // Stock de segunda dosis vacuna AZ
let ST_1SI = 0;     // Stock de primera dosis vacuna SI
let ST_2SI = 0;     // Stock de segunda dosis vacuna SI
let CGV_1SV = 0;    // Cantidad de gente vacunada con la primera dosis dosis de la vacuna SV
let CGV_2SV = 0;    // Cantidad de gente vacunada con la segunda dosis dosis de la vacuna SV
let CGV_1AZ = 0;    // Cantidad de gente vacunada con la primera dosis dosis de la vacuna AZ
let CGV_2AZ = 0;    // Cantidad de gente vacunada con la segunda dosis dosis de la vacuna AZ
let CGV_1SI = 0;    // Cantidad de gente vacunada con la primera dosis dosis de la vacuna SI
let CGV_2SI = 0;    // Cantidad de gente vacunada con la segunda dosis dosis de la vacuna SI

// -- Resultado --

let CIT = 10000;    // Cantidad de infectados total
let CAL = 0;        // Costo de almacenamiento

// --------------------------

// TEF:
let TPLL_1SV = 0; // Tiempo próxima llegada primeras dosis de la vacuna SV
let TPLL_2SV = 0; // Tiempo próxima llegada segundas dosis de la vacuna SV
let TPLL_1AZ = 0; // Tiempo próxima llegada primeras dosis de la vacuna AZ
let TPLL_2AZ = 0; // Tiempo próxima llegada segundas dosis de la vacuna AZ
let TPLL_1SI = 0; // Tiempo próxima llegada primeras dosis de la vacuna SI
let TPLL_2SI = 0; // Tiempo próxima llegada segundas dosis de la vacuna SI

let TPA_1SV = HV; // Tiempo próxima aplicación primera dosis de la vacuna SV
let TPA_1AZ = HV; // Tiempo próxima aplicación primera dosis de la vacuna AZ
let TPA_1SI = HV; // Tiempo próxima aplicación primera dosis de la vacuna SI
let TPA_2SV = []; // Tiempo próxima aplicación segunda dosis de la vacuna SI
let TPA_2AZ = []; // Tiempo próxima aplicación segunda dosis de la vacuna AZ
let TPA_2SI = []; // Tiempo próxima aplicación segunda dosis de la vacuna SI

let TPCD = 0; // Tiempo de proximos contagios diarios.

// ---

const TF = 100;
let T = 0;


do {
    console.log(`Avance: ${(T * 100 / TF).toFixed(2)}%`);

    // Determinacion del instante T en que ocurrira el proximo evento
    let minTPA_2SV = TPA_2SV.length > 0 ? TPA_2SV[0].T : HV; // No need to sort cause array is already sorted by T.
    let minTPA_2AZ = TPA_2AZ.length > 0 ? TPA_2AZ[0].T : HV; // No need to sort cause array is already sorted by T.
    let minTPA_2SI = TPA_2SI.length > 0 ? TPA_2SI[0].T : HV; // No need to sort cause array is already sorted by T.
    let nextT = Math.min(
        TPLL_1SV, TPLL_2SV, TPLL_1AZ, TPLL_2AZ, TPLL_1SI, TPLL_2SI,
        TPA_1SV, TPA_1AZ, TPA_1SI, minTPA_2SV, minTPA_2AZ, minTPA_2SI,
        TPCD);

    // Avance del Tiempo hasta ese instante T
    T = nextT;
    console.log("T:", T, "TPLL_1SV:", TPLL_1SV, "TPLL_2SV:", TPLL_2SV, "TPLL_1AZ:", TPLL_1AZ, "TPLL_2AZ:", TPLL_2AZ, "TPLL_1SI:", TPLL_1SI, "TPLL_2SI:", TPLL_2SI);
    console.log("T:", T, "TPA_1SV:", TPA_1SV, "TPA_1AZ:", TPA_1AZ, "TPA_1SI:", TPA_1SI, "minTPA_2SV:", minTPA_2SV, "minTPA_2AZ:", minTPA_2AZ, "minTPA_2SI:", minTPA_2SI);
    console.log("T:", T, "TPCD:", TPCD);


    // Determinacion del tipo de evento que ocurre en el instante T
    switch (nextT) {
        // ---- Llegadas de stock:

        case TPLL_1SV: { // Llegada stock dosis 1SV
            console.log("Llegada stock dosis 1SV");
            TPLL_1SV = T + IA_1SV();
            ST_1SV += CDR_1SV();

            // EFC: Aplicacion dosis 1SV
            if (ST_1SV > 0 && TPA_1SV === HV) {
                TPA_1SV = T + 1;
            }
            break;
        }
        case TPLL_2SV: { // Llegada stock dosis 2SV
            console.log("Llegada stock dosis 2SV");
            TPLL_2SV = T + IA_2SV();
            ST_2SV += CDR_2SV();
            break;
        }
        case TPLL_1AZ: { // Llegada stock dosis 1AZ
            console.log("Llegada stock dosis 1AZ");
            TPLL_1AZ = T + IA_1AZ();
            ST_1AZ += CDR_1AZ();

            // EFC: Aplicacion dosis 1AZ
            if (ST_1AZ > 0 && TPA_1AZ === HV) {
                TPA_1AZ = T + 1;
            }
            break;
        }
        case TPLL_2AZ: { // Llegada stock dosis 2AZ
            console.log("Llegada stock dosis 2AZ");
            TPLL_2AZ = T + IA_2AZ();
            ST_2AZ += CDR_2AZ();
            break;
        }
        case TPLL_1SI: { // Llegada stock dosis 1SI
            console.log("Llegada stock dosis 1SI");
            TPLL_1SI = T + IA_1SI();
            ST_1SI += CDR_1SI();

            // EFC: Aplicacion dosis 1SI
            if (ST_1SI > 0 && TPA_1SI === HV) {
                TPA_1SI = T + 1;
            }
            break;
        }
        case TPLL_2SI: { // Llegada stock dosis 2SI
            console.log("Llegada stock dosis 2SI");
            TPLL_2SI = T + IA_2SI();
            ST_2SI += CDR_2SI();
            break;
        }

        // ---- Aplicacion de dosis:

        case TPA_1SV: { // Aplicacion dosis 1SV
            console.log("Aplicacion dosis 1SV");
            let cantidadAplicar = Math.min(Math.floor(CMDPD() * PAPD_1SV), ST_1SV);
            ST_1SV -= cantidadAplicar; // Resto stock
            CGV_1SV += cantidadAplicar; // Sumo cantidad de gente vacunada

            // EFC: Aplicacion dosis 1SV
            if (ST_1SV > 0) {
                TPA_1SV = T + 1;
            } else {
                TPA_1SV = HV;
            }

            // EFC: Aplicacion dosis 2SV(i)
            if (CGV_1SV > CGV_2SV) {
                TPA_2SV.push({T: T + IAD_SV, cant: cantidadAplicar});
            }
            break;
        }
        case minTPA_2SV: { // Aplicacion dosis 2SV
            console.log("Aplicacion dosis 2SV");
            let cantidadAplicar = TPA_2SV[0].cant;
            let aDiferir = 0;
            if (cantidadAplicar > ST_2SV) {
                aDiferir = cantidadAplicar - ST_2SV;
                cantidadAplicar = ST_2SV;
            }
            ST_2SV -= cantidadAplicar; // Resto stock
            CGV_2SV += cantidadAplicar; // Sumo cantidad de gente vacunada

            // EFC: Aplicacion dosis 2SV(i)
            TPA_2SV.shift();
            if (CGV_2SV > CGV_1SV && aDiferir > 0) { // TODO esto no esta explicitamente reflejado en el Analisis Previo.
                TPA_2SV.push({T: TPLL_2SV, cant: aDiferir});
                TPA_2SV.sort((a, b) => a.T - b.T);
            }
            break;
        }
        case TPA_1AZ: { // Aplicacion dosis 1AZ
            console.log("Aplicacion dosis 1AZ");
            let cantidadAplicar = Math.min(Math.floor(CMDPD() * PAPD_1AZ), ST_1AZ);
            ST_1AZ -= cantidadAplicar; // Resto stock
            CGV_1AZ += cantidadAplicar; // Sumo cantidad de gente vacunada

            // EFC: Aplicacion dosis 1AZ
            if (ST_1AZ > 0) {
                TPA_1AZ = T + 1;
            } else {
                TPA_1AZ = HV;
            }

            // EFC: Aplicacion dosis 2AZ(i)
            if (CGV_1AZ > CGV_2AZ) {
                TPA_2AZ.push({T: T + IAD_AZ, cant: cantidadAplicar});
            }
            break;
        }
        case minTPA_2AZ: { // Aplicacion dosis 2AZ
            console.log("Aplicacion dosis 2AZ");
            let cantidadAplicar = TPA_2AZ[0].cant;
            let aDiferir = 0;
            if (cantidadAplicar > ST_2AZ) {
                aDiferir = cantidadAplicar - ST_2AZ;
                cantidadAplicar = ST_2AZ;
            }
            ST_2AZ -= cantidadAplicar; // Resto stock
            CGV_2AZ += cantidadAplicar; // Sumo cantidad de gente vacunada

            // EFC: Aplicacion dosis 2AZ(i)
            TPA_2AZ.shift();
            if (CGV_2AZ > CGV_1AZ && aDiferir > 0) { // TODO esto no esta explicitamente reflejado en el Analisis Previo.
                TPA_2AZ.push({T: TPLL_2AZ, cant: aDiferir});
                TPA_2AZ.sort((a, b) => a.T - b.T);
            }
            break;
        }
        case TPA_1SI: { // Aplicacion dosis 1SI
            console.log("Aplicacion dosis 1SI");
            let cantidadAplicar = Math.min(Math.floor(CMDPD() * PAPD_1SI), ST_1SI);
            ST_1SI -= cantidadAplicar; // Resto stock
            CGV_1SI += cantidadAplicar; // Sumo cantidad de gente vacunada

            // EFC: Aplicacion dosis 1SI
            if (ST_1SI > 0) {
                TPA_1SI = T + 1;
            } else {
                TPA_1SI = HV;
            }

            // EFC: Aplicacion dosis 2SI(i)
            if (CGV_1SI > CGV_2SI) {
                TPA_2SI.push({T: T + IAD_SI, cant: cantidadAplicar});
            }
            break;
        }
        case minTPA_2SI: { // Aplicacion dosis 2SI
            console.log("Aplicacion dosis 2SI");
            let cantidadAplicar = TPA_2SI[0].cant;
            let aDiferir = 0;
            if (cantidadAplicar > ST_2SI) {
                aDiferir = cantidadAplicar - ST_2SI;
                cantidadAplicar = ST_2SI;
            }
            ST_2SI -= cantidadAplicar; // Resto stock
            CGV_2SI += cantidadAplicar; // Sumo cantidad de gente vacunada

            // EFC: Aplicacion dosis 2SI(i)
            TPA_2SI.shift();
            if (CGV_2SI > CGV_1SI && aDiferir > 0) { // TODO esto no esta explicitamente reflejado en el Analisis Previo.
                TPA_2SI.push({T: TPLL_2SI, cant: aDiferir});
                TPA_2SI.sort((a, b) => a.T - b.T);
            }
            break;
        }


        // ---- Contagios diarios:

        case TPCD: { // Contagios Diarios
            console.log("Contagios Diarios");
            TPCD = T + 1;
            let nuevosContagiadosPotencial = CIT * FACTOR_R; // TODO deberiamos considerar que los contagios luego de X dias disminuyen cuando se recuperan??

            let vacunados1SV = CGV_1SV / POBLACION * nuevosContagiadosPotencial;
            let vacunados2SV = CGV_2SV / POBLACION * nuevosContagiadosPotencial;
            let vacunados1AZ = CGV_1AZ / POBLACION * nuevosContagiadosPotencial;
            let vacunados2AZ = CGV_2AZ / POBLACION * nuevosContagiadosPotencial;
            let vacunados1SI = CGV_1SI / POBLACION * nuevosContagiadosPotencial;
            let vacunados2SI = CGV_2SI / POBLACION * nuevosContagiadosPotencial;
            let noVacunados = nuevosContagiadosPotencial - vacunados1SV - vacunados2SV - vacunados1AZ - vacunados2AZ - vacunados1SI - vacunados2SI;

            let nuevosContagiados =
                vacunados1SV * (1 - EF_1SV) +
                vacunados2SV * (1 - EF_2SV) +
                vacunados1AZ * (1 - EF_1AZ) +
                vacunados2AZ * (1 - EF_2AZ) +
                vacunados1SI * (1 - EF_1SI) +
                vacunados2SI * (1 - EF_2SI) +
                noVacunados * (1 - EF_NV);

            CIT += nuevosContagiados;
            break;
        }

        default:
            throw "Illegal state!";
    }
} while (T < TF);


console.log("Terminado.");

// TODO borrar esto probablemente y todos los demas logs
console.log("T:", T);

console.log("ST_1SV:", ST_1SV);
console.log("ST_2SV:", ST_2SV);
console.log("ST_1AZ:", ST_1AZ);
console.log("ST_2AZ:", ST_2AZ);
console.log("ST_1SI:", ST_1SI);
console.log("ST_2SI:", ST_2SI);
console.log("CGV_1SV:", CGV_1SV);
console.log("CGV_2SV:", CGV_2SV);
console.log("CGV_1AZ:", CGV_1AZ);
console.log("CGV_2AZ:", CGV_2AZ);
console.log("CGV_1SI:", CGV_1SI);
console.log("CGV_2SI:", CGV_2SI);

//------

console.log("----------------------------------");
console.log("Resultados para:");
console.log("Porcentaje a aplicar por día de primera dosis de vacuna SV (PAPD_1SV):", (PAPD_1SV * 100).toFixed(2) + "%");
console.log("Porcentaje a aplicar por día de segunda dosis de vacuna SV (PAPD_2SV):", (PAPD_2SV * 100).toFixed(2) + "%");
console.log("Porcentaje a aplicar por día de primera dosis de vacuna AZ (PAPD_1AZ):", (PAPD_1AZ * 100).toFixed(2) + "%");
console.log("Porcentaje a aplicar por día de segunda dosis de vacuna AZ (PAPD_2AZ):", (PAPD_2AZ * 100).toFixed(2) + "%");
console.log("Porcentaje a aplicar por día de primera dosis de vacuna SI (PAPD_1SI):", (PAPD_1SI * 100).toFixed(2) + "%");
console.log("Porcentaje a aplicar por día de segunda dosis de vacuna SI (PAPD_2SI):", (PAPD_2SI * 100).toFixed(2) + "%");
console.log("--");
console.log("Cantidad de infectados total (CIT):", CIT);
console.log("Costo de almacenamiento (CAL):", CAL);
console.log("----------------------------------");