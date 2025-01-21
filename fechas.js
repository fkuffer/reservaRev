

// Seleccionar el formulario y añadir el evento de submit

const formulario = document.querySelector("#form");
formulario.addEventListener("submit", ingresoDatos);

function ingresoDatos(e) {
    e.preventDefault();

    let mostrarReserva = document.getElementById("mostrarReserva");
    let sector = document.getElementById("sector").value;
    let fecha_inicio = document.getElementById("fecha-inicio").value;
    let fecha_fin = document.getElementById("fecha-fin").value;
    let usuario = document.querySelector("#usuario").value;
    let medioElevacion = document.getElementById("medioElevacion");
    let text = medioElevacion.options[medioElevacion.selectedIndex].text;

    // Validar que todos los campos estén completos
    if (usuario === '' || sector === '' || fecha_inicio === '' || fecha_fin === '' || text === "ELIJA AQUI") {
        error("Debe completar todos los campos");
        return;
    }

    // Verificar si el medio de elevación está disponible
    if (!esMedioDisponible(text, fecha_inicio, fecha_fin)) {
        error("Este medio de elevación ya está reservado en el rango de fechas indicado");
        return;
    }

    let datosReserva = { sector, fecha_inicio, fecha_fin, usuario, text, confirmado: false };

    // Mostrar la reserva en el DOM con botones
    mostrarReserva.innerHTML = `
        <div class="reserva" style="width: 28rem; padding: 1rem; border: 1px solid #ccc; border-radius: 5px; margin-bottom: 1rem;">
            <h3>Reserva Pendiente</h3>
            <p><strong>USUARIO:</strong> ${usuario}</p>
            <p><strong>SECTOR:</strong> ${sector}</p>
            <p><strong>FECHA INICIO:</strong> ${fecha_inicio}</p>
            <p><strong>FECHA FIN:</strong> ${fecha_fin}</p>
            <p><strong>MEDIO DE ELEVACIÓN:</strong> ${text}</p>
            <button id="confirmarBtn" class="btn btn-primary btn-block">Confirmar Reserva</button>
            <button id="eliminarBtn" class="btn btn-primary btn-block">Eliminar Reserva</button>
        </div>`;

    // Event listener para confirmar la reserva
    document.getElementById("confirmarBtn").addEventListener("click", function() {
        datosReserva.confirmado = true; // Marcar la reserva como confirmada
        registrosEnLocal(datosReserva); // Guardar la reserva confirmada en localStorage
        mostrarReserva.innerHTML = `<div class="reserva-confirmada">
            <h3>Reserva Confirmada</h3>
            <p><strong>USUARIO:</strong> ${usuario}</p>
            <p><strong>SECTOR:</strong> ${sector}</p>
            <p><strong>FECHA INICIO:</strong> ${fecha_inicio}</p>
            <p><strong>FECHA FIN:</strong> ${fecha_fin}</p>
            <p><strong>MEDIO DE ELEVACIÓN:</strong> ${text}</p>
        </div>`;
    });

    // Event listener para eliminar la reserva
    document.getElementById("eliminarBtn").addEventListener("click", function() {
        let confirmacion = confirm("¿Estás seguro de que deseas eliminar esta reserva?");
        if (confirmacion) {
            eliminarReserva(datosReserva);  // Eliminar la reserva de localStorage
            mostrarReserva.innerHTML = '';  // Eliminar la reserva del DOM
            alert("Reserva eliminada correctamente");
        }
    });

    // Limpiar el formulario después de la reserva
    formulario.reset();
}


// Verificar disponibilidad del medio de elevación
function esMedioDisponible(medio, fechaInicio, fechaFin) {
    // Intentar parsear las reservas existentes
    let reservasExistentes = JSON.parse(localStorage.getItem("Reserva Nueva: ")) || [];

    // Asegurarse de que reservasExistentes es un array
    if (!Array.isArray(reservasExistentes)) {
        reservasExistentes = [];
    }

    // Revisar si el medio de elevación está ocupado en el rango de fechas
    for (let reserva of reservasExistentes) {
        let { sector, fecha_inicio, fecha_fin, usuario, text: medioReserva } = reserva;

        // Verificar si el medio de elevación es el mismo y si las fechas se solapan
        if (medio === medioReserva) {
            if (
                (fechaInicio >= fecha_inicio && fechaInicio <= fecha_fin) || // Fecha inicio dentro del rango
                (fechaFin >= fecha_inicio && fechaFin <= fecha_fin) || // Fecha fin dentro del rango
                (fechaInicio <= fecha_inicio && fechaFin >= fecha_fin) // Fechas completamente solapadas
            ) {
                return false; // El medio ya está reservado en las fechas
            }
        }
    }

    return true; // El medio está disponible
}

// Guardar nueva reserva en localStorage
function registrosEnLocal(reserva) {
    let reservasExistentes = JSON.parse(localStorage.getItem("Reserva Nueva: ")) || [];
    reservasExistentes.push(reserva); // Agregar la nueva reserva
    localStorage.setItem("Reserva Nueva: ", JSON.stringify(reservasExistentes));
}

// Eliminar reserva del localStorage
function eliminarReserva(reservaAEliminar) {
    let reservasExistentes = JSON.parse(localStorage.getItem("Reserva Nueva: ")) || [];

    // Eliminar la reserva específica comparando los valores del objeto
    reservasExistentes = reservasExistentes.filter(reserva => {
        return reserva.sector !== reservaAEliminar.sector || 
               reserva.fecha_inicio !== reservaAEliminar.fecha_inicio || 
               reserva.fecha_fin !== reservaAEliminar.fecha_fin || 
               reserva.usuario !== reservaAEliminar.usuario || 
               reserva.text !== reservaAEliminar.text;
    });

    localStorage.setItem("Reserva Nueva: ", JSON.stringify(reservasExistentes));
}


// Obtener reservas y generar archivo sin mostrarlas en el DOM
let obtenerDatos = document.getElementById("obtenerDatos");

obtenerDatos.addEventListener("click", function (e) {
    // Obtener los datos almacenados en localStorage
    let muestraReserva = localStorage.getItem("Reserva Nueva: ");
    
    // Verificar si los datos existen en localStorage
    if (muestraReserva) {
        let datoParse = JSON.parse(muestraReserva);

        // Convertir el array de objetos en una hoja de cálculo Excel
        const ws = XLSX.utils.json_to_sheet(datoParse);
        const wb = XLSX.utils.book_new();
        
        // Añadir la hoja de cálculo al libro
        XLSX.utils.book_append_sheet(wb, ws, "Reservas");

        // Crear un archivo Excel y descargarlo
        XLSX.writeFile(wb, "reservas.xlsx");
    } else {
        alert("No se encontraron reservas en el almacenamiento.");
    }
    
    // Evitar que se ejecute la acción predeterminada del evento
    e.preventDefault();
});


/* obtenerDatos.addEventListener("click", function (e) {
    let muestraReserva = localStorage.getItem("Reserva Nueva: ");
    let datoParse = JSON.parse(muestraReserva);

    // No mostrar las reservas en el DOM, solo generar el archivo
    const blob = new Blob([JSON.stringify(datoParse, null, 2)], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'reservas.txt'; // Nombre del archivo
    link.click();
    e.preventDefault();
}); */

// Función para borrar las reservas del localStorage
let borrarDatos = document.getElementById("borrarDatos");

borrarDatos.addEventListener("click", function() {
    let confirmacion = confirm("¿Estás seguro de que deseas borrar todas las reservas?");
    if (confirmacion) {
        localStorage.clear();
        alert("Las reservas han sido borradas correctamente.");
    }
});


// Mostrar error si falta información
function error(mensaje) {
    console.log(mensaje);
    const muestraError = document.getElementById("muestraError");
    muestraError.textContent = mensaje;
    muestraError.classList.add("error");
    formulario.appendChild(muestraError);
    setTimeout(() => {
        muestraError.remove();
    }, 3000);
}
