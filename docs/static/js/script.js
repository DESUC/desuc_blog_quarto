var Fn = {
  validaRut: function (rutCompleto) {
    rutCompleto = rutCompleto.replace("‐", "-");
    if (!/^[0-9]+[-|‐]{1}[0-9kK]{1}$/.test(rutCompleto))
      return false;
    var tmp = rutCompleto.split('-');
    var digv = tmp[1];
    var rut = tmp[0];
    if (digv == 'K') digv = 'k';
    return (Fn.dv(rut) == digv);
  },
  dv: function (T) {
    var M = 0,
      S = 1;
    for (; T; T = Math.floor(T / 10))
      S = (S + T % 10 * (9 - M++ % 6)) % 11;
    return S ? S - 1 : 'k';
  }
}

function toTitleCase(str) {
  return str.toLowerCase().replace(/(?:^|\s)\w/g, match => match.toUpperCase());
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function parseDate(input) {
  var parts = input.split('/');
  return new Date(parts[2], parts[1]-1, parts[0]);
}

function formatDate(date) {
  var dd = String(date.getDate()).padStart(2, '0');
  var mm = String(date.getMonth() + 1).padStart(2, '0');
  var yyyy = date.getFullYear();

  return dd + '/' + mm + '/' + yyyy;
}

function escapeHTML(text) {
  var element = document.createElement('div');
  element.innerText = text;
  return element.innerHTML;
}

function buscarEmpleado() {
  const rutInput = document.getElementById('rut');
  let rut = rutInput.value.replace(/[^\dkK]+/g, ''); 

  if (rut.length === 9 && rut.startsWith('0')) {
    rut = rut.slice(1); 
  }

  rut = rut.slice(0, -1) + '-' + rut.slice(-1); 

  rutInput.value = rut; 

  if (!Fn.validaRut(rut)) {
    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.textContent = 'El RUT no es válido.';
    return; 
  }

  setTimeout(function() {
    fetch(`https://enc.eventodesuc.cl/${rut}`)
    .then(response => response.json())
    .then(data => {
      const resultadoDiv = document.getElementById('resultado');
      resultadoDiv.innerHTML = '';

      if (data.error) {
        resultadoDiv.innerHTML = `
          <div class="error-message" alert alert-danger>
            <p>${data.error}</p>
            <p>Por favor, verifique el RUT ingresado.</p>
          </div>
        `;
      } else {
        const proyectosActivos = data.proyectosActivos;

        if (proyectosActivos && proyectosActivos.length > 0) {
          const nombreEmpleado = toTitleCase(data.Nombre);
          const apellidosEmpleado = toTitleCase(data.Apellidos);
          let imagenEmpleado = data.imagenURL;

          if (data.sinImagen) {
            resultadoDiv.innerHTML = `
              <div class="empleado-encontrado">
                <img src="${imagenEmpleado}" alt="Imagen del empleado" class="imagen-empleado" style="max-width: 100%; max-height: 100%; width: 200px; height: 250px; border: 1px solid #ddd; border-radius: 2px; padding: 10px; object-fit: fill;">
                <div class="info-empleado">
                  <h3>Encuestador encontrado:</h3>
                  <h2>${nombreEmpleado} ${apellidosEmpleado}</h2>
                </div>
              </div>
            `;
          } else {
            resultadoDiv.innerHTML = `
              <div class="empleado-encontrado">
                <img src="${imagenEmpleado}" alt="Imagen del empleado" class="imagen-empleado">
                <div class="info-empleado">
                  <h3>Encuestador encontrado:</h3>
                  <h2>${nombreEmpleado} ${apellidosEmpleado}</h2>
                </div>
              </div>
            `;
          }

          resultadoDiv.innerHTML += `
            <h4>Proyectos en los que se encuentra activo</h4>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Fecha inicio</th>
                  <th>Fecha término</th>
                </tr>
              </thead>
              <tbody>
                ${proyectosActivos.map(proyecto => `
                  <tr>
                    <td class="text-center">${capitalizeFirstLetter(proyecto.nombre)}</td>
                    <td class="text-center">${formatDate(parseDate(proyecto.fechaInicio))}</td>
                    <td class="text-center">${formatDate(parseDate(proyecto.fechaFin))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <hr>
          `;
          const proyectosExpirados = data.proyectosExpirados;

          if (proyectosExpirados && proyectosExpirados.length > 0) {
            resultadoDiv.innerHTML += `
              <h4>Proyectos en los que participó</h4>
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Fecha inicio</th>
                    <th>Fecha término</th>
                  </tr>
                </thead>
                <tbody>
                  ${proyectosExpirados.map(proyecto => `
                    <tr>
                      <td class="text-center">${capitalizeFirstLetter(proyecto.nombre)}</td>
                      <td class="text-center">${formatDate(parseDate(proyecto.fechaInicio))}</td>
                      <td class="text-center">${formatDate(parseDate(proyecto.fechaFin))}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `;
          } else {
            resultadoDiv.innerHTML += `
              <h5>No se encontraron proyectos en los que participó.</h5>
            `;
          }
        } else {
          resultadoDiv.innerHTML = `
            <p class="mensaje-no-encontrado">El encuestador no se encuentra en proyectos activos.</p>
          `;
        }

        resultadoDiv.innerHTML += `
          <button class="btn btn-primary mb-3" onclick="limpiarBusqueda()">Volver atrás</button>
        `;
      }
    })
    .catch(error => {
      console.error(error);
    });

    }, 500);
}

document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const rut = urlParams.get('rut');

  if (rut) {
    document.getElementById('rut').value = rut;
    buscarEmpleado();
  }
});

function limpiarBusqueda() {
  document.getElementById('rut').value = '';
  document.getElementById('resultado').innerHTML = '';
}
