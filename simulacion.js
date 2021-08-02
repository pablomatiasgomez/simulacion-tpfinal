#!/usr/bin/env node

const DEBUG = false;

function debug() {
    if (!DEBUG) return;
    console.debug.apply(this, arguments);
}

const HV = Number.MAX_SAFE_INTEGER;

// constantes:
const IAD_SV = 21; // Intervalo entre aplicacion de primer y segunda dosis SV
const IAD_AZ = 28; // Intervalo entre aplicacion de primer y segunda dosis AZ
const IAD_SI = 21; // Intervalo entre aplicacion de primer y segunda dosis SI
const FACTOR_CONTACTO_ESTRECHO = 0.165; // Cantidad de gente que tiene contacto estrecho con contagiados y son posbiles nuevos contagiados.
const EF_1SV = 0.740; // Efectividad de la primera dosis de SV de no contraer la enfermedad
const EF_2SV = 0.933; // Efectividad de la segunda dosis de SV de no contraer la enfermedad
const EF_1AZ = 0.795; // Efectividad de la primera dosis de AZ de no contraer la enfermedad
const EF_2AZ = 0.888; // Efectividad de la segunda dosis de AZ de no contraer la enfermedad
const EF_1SI = 0.616; // Efectividad de la primera dosis de SI de no contraer la enfermedad
const EF_2SI = 0.840; // Efectividad de la segunda dosis de SI de no contraer la enfermedad
const EF_NV = 0.35; // "Efectividad" (probabilidad) de no contraer la enfermedad al ser contracto estrecho
const DIAS_CONTAGIOSO = 10; // Cantidad de dias para considerar a una persona conatagiada (y que contagia a otros)
const POBLACION = 450_000_000; // Numero de poblacion de la simulacion para estimar cuanta gente esta vacunada. Como usamos un TF alto, necesitamos una poblacion alta para iterar muchas veces.
const CAL_SV = 0.0001; // Costo de almacenamiento de la vacuna SV
const CAL_AZ = 0.0001; // Costo de almacenamiento de la vacuna AZ
const CAL_SI = 0.0001; // Costo de almacenamiento de la vacuna SI

// ------- Variables -------

// -- Control: --

let PAPD_1SV; // Porcentaje a aplicar por día de primera dosis de vacuna SV
let PAPD_2SV; // Porcentaje a aplicar por día de segunda dosis de vacuna SV
let PAPD_1AZ; // Porcentaje a aplicar por día de primera dosis de vacuna AZ
let PAPD_2AZ; // Porcentaje a aplicar por día de segunda dosis de vacuna AZ
let PAPD_1SI; // Porcentaje a aplicar por día de primera dosis de vacuna SI
let PAPD_2SI; // Porcentaje a aplicar por día de segunda dosis de vacuna SI

const escenario = 1; // Cambiar entre 1, 2 y 3 para correr diferentes escenarios.
switch (escenario) {
    case 1: // Escenario 1: 33% cada tipo de vacuna:
        PAPD_1SV = 1 / 6;
        PAPD_2SV = 1 / 6;
        PAPD_1AZ = 1 / 6;
        PAPD_2AZ = 1 / 6;
        PAPD_1SI = 1 / 6;
        PAPD_2SI = 1 / 6;
        break;
    case 2: // Escenario 1: 33% para primer dosis de sputnik V, igual porcentaje para el resto:
        PAPD_1SV = 1 / 3;
        PAPD_2SV = 2 / 3 / 5;
        PAPD_1AZ = 2 / 3 / 5;
        PAPD_2AZ = 2 / 3 / 5;
        PAPD_1SI = 2 / 3 / 5;
        PAPD_2SI = 2 / 3 / 5;
        break;
    case 3: // Escenario 3:
        PAPD_1SV = 0.20;
        PAPD_2SV = 0;
        PAPD_1AZ = 0.45;
        PAPD_2AZ = 0;
        PAPD_1SI = 0.35;
        PAPD_2SI = 0;
        break;
}

if ((PAPD_1SV + PAPD_2SV + PAPD_1AZ + PAPD_2AZ + PAPD_1SI + PAPD_2SI).toFixed(4) !== "1.0000") {
    throw "Configuracion invalida, la sumatoria de porcentajes a aplicar debe ser 1.";
}


// -- Datos: --

// Intervalo entre arrivos de stock de primera dosis de vacuna SV
function IA_1SV() {
    let R = Math.random();
    // f(R) = 2.0113/((1/R-1)^(1/7.0000))+7.0000
    return Math.ceil(2.0113 / ((1 / R - 1) ** (1 / 7)) + 7);
}

// Intervalo entre arrivos de stock de segunda dosis de vacuna SV
function IA_2SV() {
    let R = Math.random();
    // f(R) = R*(50.0000-2.0000)+2.0000
    return Math.ceil(R * (50 - 2) + 2);
}

// Intervalo entre arrivos de stock de dosis de vacuna AZ
function IA_AZ() {
    let R = Math.random();
    // f(R) = 2.0046/((1/R-1)^(1/7.0000))+7.0000
    return Math.ceil(2.0046 / ((1 / R - 1) ** (1 / 7)) + 7);
}

// Intervalo entre arrivos de stock de dosis de vacuna SI
function IA_SI() {
    let R = Math.random();
    // f(R) = ln(-R+1)/(-0.0956)
    return Math.ceil(Math.log(-R + 1) / (-0.0956));
}


// Cantidad de dosis recibidas de primera dosis de vacuna SV cada IA_1SV días
function CDR_1SV() {
    let R = Math.random();
    // Logistic(1.1425E+5; 2.8748E+5)
    return Math.max(0, Math.ceil(287480 - 114250 * Math.log(1 / R - 1)));
}

// Cantidad de dosis recibidas de segunda dosis de vacuna SV cada IA_2SV días
function CDR_2SV() {
    let R = Math.random();
    // Dagum(0.10907; 5.8144; 4.6462E+5)
    return Math.max(0, Math.ceil(((R ** (-1 / 0.10907) - 1) ** (-1 / 5.8144)) * 464620));
}

// Cantidad de dosis recibidas de vacuna AZ cada IA_AZ días
function CDR_AZ() {
    let R = Math.random();
    // Cauchy(2.0303E+5; 8.3071E+5)
    return Math.max(0, Math.ceil(Math.tan((R - 0.5) * Math.PI) * 203035 + 830710));
}

// Cantidad de dosis recibidas de vacuna SI cada IA_SI días
function CDR_SI() {
    let R = Math.random();
    // GumbelMin(2.3469E+5; 8.1580E+5)
    return Math.max(0, Math.ceil(234690 * Math.log(-Math.log(1 - R)) + 815800));
}

// Cantidad máxima de dosis a aplicar por día
function CMDPD() {
    let R = Math.random();
    // PowerFunc(0.50618; 121.0; 4.1374E+5)
    return Math.ceil((413740 - 121) * R ** (1 / 0.50618) + 121);
}

// -- Estado: --

let ST_1SV = 0;     // Stock de primera dosis vacuna SV
let ST_2SV = 0;     // Stock de segunda dosis vacuna SV
let ST_AZ = 0;      // Stock de dosis vacuna AZ
let ST_SI = 0;      // Stock de dosis vacuna SI
let CGV_1SV = 0;    // Cantidad de gente vacunada con la primera dosis dosis de la vacuna SV
let CGV_2SV = 0;    // Cantidad de gente vacunada con la segunda dosis dosis de la vacuna SV
let CGV_1AZ = 0;    // Cantidad de gente vacunada con la primera dosis dosis de la vacuna AZ
let CGV_2AZ = 0;    // Cantidad de gente vacunada con la segunda dosis dosis de la vacuna AZ
let CGV_1SI = 0;    // Cantidad de gente vacunada con la primera dosis dosis de la vacuna SI
let CGV_2SI = 0;    // Cantidad de gente vacunada con la segunda dosis dosis de la vacuna SI
let CI = 100000;    // Cantidad de infectados (con valor inicial por que multiplicamos a partir de esta base)

// -- Resultado --

let CIT = 0;        // Cantidad de infectados total
let CAL = 0;        // Costo de almacenamiento

// --------------------------

// TEF:
let TPLL_1SV = 0; // Tiempo próxima llegada primeras dosis de la vacuna SV
let TPLL_2SV = 0; // Tiempo próxima llegada segundas dosis de la vacuna SV
let TPLL_AZ = 0;  // Tiempo próxima llegada dosis de la vacuna AZ
let TPLL_SI = 0;  // Tiempo próxima llegada dosis de la vacuna SI

let TPA_1SV = HV; // Tiempo próxima aplicación primera dosis de la vacuna SV
let TPA_1AZ = HV; // Tiempo próxima aplicación primera dosis de la vacuna AZ
let TPA_1SI = HV; // Tiempo próxima aplicación primera dosis de la vacuna SI
let TPA_2SV = []; // Tiempo próxima aplicación segunda dosis de la vacuna SI
let TPA_2AZ = []; // Tiempo próxima aplicación segunda dosis de la vacuna AZ
let TPA_2SI = []; // Tiempo próxima aplicación segunda dosis de la vacuna SI
let TPCC = [{T: DIAS_CONTAGIOSO, cant: CI}]; // Tiempo próxima curacion de contagiados
let TPC = 0; // Tiempo de proximos contagios diarios.

// ---

const TF = 50000;
let T = 0;
let ITA_1SV = 0; // Inicio tiempo almacenamiento de primera dosis de la vacuna SV
let ITA_2SV = 0; // Inicio tiempo almacenamiento de segunda dosis de la vacuna SV
let ITA_AZ = 0; // Inicio tiempo almacenamiento de la vacuna AZ
let ITA_SI = 0; // Inicio tiempo almacenamiento de la vacuna SI

do {
    if ((T * 100 / TF) % 1 === 0) {
        DEBUG || console.clear();
        console.log(`Avance: ${(T * 100 / TF).toFixed(2)}%`);
    }

    // Determinacion del instante T en que ocurrira el proximo evento
    let minTPA_2SV = TPA_2SV.length > 0 ? TPA_2SV[0].T : HV; // No need to sort cause array is already sorted by T.
    let minTPA_2AZ = TPA_2AZ.length > 0 ? TPA_2AZ[0].T : HV; // No need to sort cause array is already sorted by T.
    let minTPA_2SI = TPA_2SI.length > 0 ? TPA_2SI[0].T : HV; // No need to sort cause array is already sorted by T.
    let minTPCC = TPCC.length > 0 ? TPCC[0].T : HV; // No need to sort cause array is already sorted by T.
    let nextT = Math.min(
        TPLL_1SV, TPLL_2SV, TPLL_AZ, TPLL_SI,
        TPA_1SV, TPA_1AZ, TPA_1SI, minTPA_2SV, minTPA_2AZ, minTPA_2SI,
        TPC, minTPCC);

    // Avance del Tiempo hasta ese instante T
    T = nextT;

    // Log de TEF:
    debug("---- TEF: ----- ", `T/TF: ${T}/${TF}`);
    debug("TPLL_1SV:", TPLL_1SV, "TPLL_2SV:", TPLL_2SV, "TPLL_AZ:", TPLL_AZ, "TPLL_SI:", TPLL_SI,);
    debug("TPA_1SV:", TPA_1SV, "TPA_1AZ:", TPA_1AZ, "TPA_1SI:", TPA_1SI, "minTPA_2SV:", minTPA_2SV, "minTPA_2AZ:", minTPA_2AZ, "minTPA_2SI:", minTPA_2SI);
    debug("TPC:", TPC);
    // Log de estado:
    debug("---- Estado: ----- ", `T/TF: ${T}/${TF}`);
    debug("ST_1SV:", ST_1SV, "ST_2SV:", ST_2SV, "ST_AZ:", ST_AZ, "ST_SI:", ST_SI);
    debug("CGV_1SV:", CGV_1SV, "CGV_2SV:", CGV_2SV);
    debug("CGV_1AZ:", CGV_1AZ, "CGV_2AZ:", CGV_2AZ);
    debug("CGV_1SI:", CGV_1SI, "CGV_2SI:", CGV_2SI);
    debug("CI:", CI, "CIT:", CIT, "CAL:", CAL);


    // Determinacion del tipo de evento que ocurre en el instante T
    switch (nextT) {
        // ---- Llegadas de stock:

        case TPLL_1SV: { // Llegada stock dosis 1SV
            debug("Llegada stock dosis 1SV");
            CAL += ST_1SV * CAL_SV * (T - ITA_1SV);
            ITA_1SV = T;

            TPLL_1SV = T + IA_1SV();
            ST_1SV += CDR_1SV();

            // EFC: Aplicacion dosis 1SV
            if (ST_1SV > 0 && TPA_1SV === HV) {
                TPA_1SV = T + 1;
            }
            break;
        }
        case TPLL_2SV: { // Llegada stock dosis 2SV
            CAL += ST_2SV * CAL_SV * (T - ITA_2SV);
            ITA_2SV = T;

            debug("Llegada stock dosis 2SV");
            TPLL_2SV = T + IA_2SV();
            ST_2SV += CDR_2SV();
            break;
        }
        case TPLL_AZ: { // Llegada stock dosis AZ
            debug("Llegada stock dosis AZ");
            CAL += ST_AZ * CAL_AZ * (T - ITA_AZ);
            ITA_AZ = T;

            TPLL_AZ = T + IA_AZ();
            ST_AZ += CDR_AZ();

            // EFC: Aplicacion dosis 1AZ
            if (ST_AZ > 0 && TPA_1AZ === HV) {
                TPA_1AZ = T + 1;
            }
            break;
        }
        case TPLL_SI: { // Llegada stock dosis SI
            debug("Llegada stock dosis SI");
            CAL += ST_SI * CAL_SI * (T - ITA_SI);
            ITA_SI = T;

            TPLL_SI = T + IA_SI();
            ST_SI += CDR_SI();

            // EFC: Aplicacion dosis 1SI
            if (ST_SI > 0 && TPA_1SI === HV) {
                TPA_1SI = T + 1;
            }
            break;
        }

        // ---- Aplicacion de dosis:

        case TPA_1SV: { // Aplicacion dosis 1SV
            debug("Aplicacion dosis 1SV");
            CAL += ST_1SV * CAL_SV * (T - ITA_1SV);
            ITA_1SV = T;

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
            debug("Aplicacion dosis 2SV");
            CAL += ST_2SV * CAL_SV * (T - ITA_2SV);
            ITA_2SV = T;

            let cantidadAplicar = Math.min(TPA_2SV[0].cant, Math.floor(CMDPD() * PAPD_2SV), ST_2SV);
            let aDiferir = 0;
            if (cantidadAplicar < TPA_2SV[0].cant) {
                aDiferir = TPA_2SV[0].cant - cantidadAplicar;
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
            debug("Aplicacion dosis 1AZ");
            CAL += ST_AZ * CAL_AZ * (T - ITA_AZ);
            ITA_AZ = T;

            let cantidadAplicar = Math.min(Math.floor(CMDPD() * PAPD_1AZ), ST_AZ);
            ST_AZ -= cantidadAplicar; // Resto stock
            CGV_1AZ += cantidadAplicar; // Sumo cantidad de gente vacunada

            // EFC: Aplicacion dosis 1AZ
            if (ST_AZ > 0) {
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
            debug("Aplicacion dosis 2AZ");
            CAL += ST_AZ * CAL_AZ * (T - ITA_AZ);
            ITA_AZ = T;

            let cantidadAplicar = Math.min(TPA_2AZ[0].cant, Math.floor(CMDPD() * PAPD_2AZ), ST_AZ);
            let aDiferir = 0;
            if (cantidadAplicar < TPA_2AZ[0].cant) {
                aDiferir = TPA_2AZ[0].cant - cantidadAplicar;
            }
            ST_AZ -= cantidadAplicar; // Resto stock
            CGV_2AZ += cantidadAplicar; // Sumo cantidad de gente vacunada

            // EFC: Aplicacion dosis 2AZ(i)
            TPA_2AZ.shift();
            if (CGV_2AZ > CGV_1AZ && aDiferir > 0) { // TODO esto no esta explicitamente reflejado en el Analisis Previo.
                TPA_2AZ.push({T: TPLL_AZ, cant: aDiferir});
                TPA_2AZ.sort((a, b) => a.T - b.T);
            }
            break;
        }
        case TPA_1SI: { // Aplicacion dosis 1SI
            debug("Aplicacion dosis 1SI");
            CAL += ST_SI * CAL_SI * (T - ITA_SI);
            ITA_SI = T;

            let cantidadAplicar = Math.min(Math.floor(CMDPD() * PAPD_1SI), ST_SI);
            ST_SI -= cantidadAplicar; // Resto stock
            CGV_1SI += cantidadAplicar; // Sumo cantidad de gente vacunada

            // EFC: Aplicacion dosis 1SI
            if (ST_SI > 0) {
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
            debug("Aplicacion dosis 2SI");
            CAL += ST_SI * CAL_SI * (T - ITA_SI);
            ITA_SI = T;

            let cantidadAplicar = Math.min(TPA_2SI[0].cant, Math.floor(CMDPD() * PAPD_2SI), ST_SI);
            let aDiferir = 0;
            if (cantidadAplicar < TPA_2SI[0].cant) {
                aDiferir = TPA_2SI[0].cant - cantidadAplicar;
            }
            ST_SI -= cantidadAplicar; // Resto stock
            CGV_2SI += cantidadAplicar; // Sumo cantidad de gente vacunada

            // EFC: Aplicacion dosis 2SI(i)
            TPA_2SI.shift();
            if (CGV_2SI > CGV_1SI && aDiferir > 0) { // TODO esto no esta explicitamente reflejado en el Analisis Previo.
                TPA_2SI.push({T: TPLL_SI, cant: aDiferir});
                TPA_2SI.sort((a, b) => a.T - b.T);
            }
            break;
        }


        // ---- Contagios diarios:

        case TPC: { // Contagios Diarios
            debug("Contagios Diarios");
            TPC = T + 1;
            let nuevosContagiadosPotencial = Math.min(CI * FACTOR_CONTACTO_ESTRECHO, POBLACION - CI);

            let vacunados1SV = CGV_1SV / POBLACION * nuevosContagiadosPotencial;
            let vacunados2SV = CGV_2SV / POBLACION * nuevosContagiadosPotencial;
            let vacunados1AZ = CGV_1AZ / POBLACION * nuevosContagiadosPotencial;
            let vacunados2AZ = CGV_2AZ / POBLACION * nuevosContagiadosPotencial;
            let vacunados1SI = CGV_1SI / POBLACION * nuevosContagiadosPotencial;
            let vacunados2SI = CGV_2SI / POBLACION * nuevosContagiadosPotencial;
            let noVacunados = nuevosContagiadosPotencial - vacunados1SV - vacunados2SV - vacunados1AZ - vacunados2AZ - vacunados1SI - vacunados2SI;

            let nuevosContagiados = Math.floor(
                vacunados1SV * (1 - EF_1SV) +
                vacunados2SV * (1 - EF_2SV) +
                vacunados1AZ * (1 - EF_1AZ) +
                vacunados2AZ * (1 - EF_2AZ) +
                vacunados1SI * (1 - EF_1SI) +
                vacunados2SI * (1 - EF_2SI) +
                noVacunados * (1 - EF_NV));

            CI += nuevosContagiados;
            CIT += nuevosContagiados;

            // EFC: Curacion Contagiados
            if (CI > 0 && nuevosContagiados > 0) {
                TPCC.push({T: T + DIAS_CONTAGIOSO, cant: nuevosContagiados});
            }
            break;
        }
        case minTPCC: { // Curacion Contagiados
            debug("Curacion Contagiados");
            let cantidadRecuperados = TPCC[0].cant;
            CI -= cantidadRecuperados;
            TPCC.shift();
            break;
        }

        default:
            throw "Illegal state!";
    }
} while (T < TF);

console.log("Terminado.");
console.log("---- Estado Final: ----- ", `T/TF: ${T}/${TF}`);
console.log("ST_1SV:", ST_1SV, "ST_2SV:", ST_2SV, "ST_AZ:", ST_AZ, "ST_SI:", ST_SI);
console.log("CGV_1SV:", CGV_1SV, "CGV_2SV:", CGV_2SV);
console.log("CGV_1AZ:", CGV_1AZ, "CGV_2AZ:", CGV_2AZ);
console.log("CGV_1SI:", CGV_1SI, "CGV_2SI:", CGV_2SI);
console.log("CI:", CI, "CIT:", CIT, "CAL:", CAL);
console.log("----------------------------------");
console.log("Resultados para:");
console.log("Porcentaje a aplicar por día de primera dosis de vacuna SV (PAPD_1SV):", (PAPD_1SV * 100).toFixed(2) + "%");
console.log("Porcentaje a aplicar por día de segunda dosis de vacuna SV (PAPD_2SV):", (PAPD_2SV * 100).toFixed(2) + "%");
console.log("Porcentaje a aplicar por día de primera dosis de vacuna AZ (PAPD_1AZ):", (PAPD_1AZ * 100).toFixed(2) + "%");
console.log("Porcentaje a aplicar por día de segunda dosis de vacuna AZ (PAPD_2AZ):", (PAPD_2AZ * 100).toFixed(2) + "%");
console.log("Porcentaje a aplicar por día de primera dosis de vacuna SI (PAPD_1SI):", (PAPD_1SI * 100).toFixed(2) + "%");
console.log("Porcentaje a aplicar por día de segunda dosis de vacuna SI (PAPD_2SI):", (PAPD_2SI * 100).toFixed(2) + "%");
console.log("--");
console.log("Porcentaje de infectados total:", (CIT * 100 / POBLACION).toFixed(2) + "%");
console.log("Costo de almacenamiento diario promedio:", (CAL / TF).toLocaleString("es-AR"));
console.log("----------------------------------");
