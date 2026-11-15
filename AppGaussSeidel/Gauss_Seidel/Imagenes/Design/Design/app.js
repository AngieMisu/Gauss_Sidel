document.addEventListener("DOMContentLoaded", () => { 

    const matrix = document.getElementById("matriz"); //contenedor de la matriz A
    const vectorB = document.getElementById("vectorB"); //contenedor del vector B
    const btn = document.getElementById("graficar"); //botón para ejecutar el método de Gauss-Seidel

    const criterio = document.getElementById("criterio"); //select para elegir el criterio de parada (error o iteraciones)
    const errorBox = document.getElementById("errorBox"); //contenedor para el input de tolerancia (visible solo si se elige criterio de error)
    const iterBox = document.getElementById("iterBox"); //contenedor para el input de máximo de iteraciones

    const toleranciaInput = document.getElementById("tolerancia"); //input para la tolerancia (visible solo si se elige criterio de error)
    const maxIterInput = document.getElementById("maxIter");//input para el máximo de iteraciones (visible solo si se elige criterio de iteraciones)

    const x1Input = document.getElementById("X1");//input para el valor inicial de X1,X2,X3
    const x2Input = document.getElementById("X2");
    const x3Input = document.getElementById("X3");

    let ggb = null; // variable para almacenar la instancia de GeoGebra

    // Configuración de la aplicación GeoGebra
    const params = {
        appName: "3d", // Usamos la versión 3D para poder graficar planos
        width: 800,
        height: 600,
        showToolBar: false, // Oculta la barra de herramientas
        showAlgebraInput: false, // Oculta el input de álgebra
        showMenuBar: false, // Oculta la barra de menú
        appletOnLoad: (api) => ggb = api // Guarda la instancia de GeoGebra para usarla después
    };

    const app = new GGBApplet(params, true); // Crea la aplicación GeoGebra con los parámetros definidos
    window.addEventListener("load", () => { app.inject("ggb-element"); }); //muestra la aplicación GeoGebra en el contenedor con id "ggb-element"

    const num = v => { // Función para convertir texto a número, devolviendo 0 si no es un número válido
        const val = parseFloat(v.trim()); // Eliminamos espacios y convertimos a número
        return isNaN(val) ? 0 : val; // Si no es un número, devolvemos 0 para evitar errores en los cálculos
    };

    //iniciamos la matriz A y el vector B 
    if (matrix.innerHTML.trim() === "") //para no sobreescribir si ya hay valores
    { 
        for (let i = 0; i < 9; i++) // ciclo para las 9 celdas para la matriz 3x3
        {
            const cell = document.createElement("div"); //creamos un nuevo div para cada celda
            cell.className = "cell"; //le damos la clase "cell" para el estilo
            cell.contentEditable = true; //hacemos que el contenido sea editable para que el usuario pueda ingresar los valores
            cell.innerText = (i === 0 || i === 4 || i === 8) ? "3" : "1"; //inicializamos con valores ya escritos
            matrix.appendChild(cell); //hace que podamos ver las celdas en el contenedor de la matriz A
        }
    }
    if (vectorB.innerHTML.trim() === "") //para no sobreescribir si ya hay valores
    {
        for (let i = 0; i < 3; i++) // ciclo para las 3 celdas del vector B
        {
            const cell = document.createElement("div"); //creamos un nuevo div para cada celda
            cell.className = "cell";
            cell.contentEditable = true;
            cell.innerText = "1"; //inicializamos con valores ya escritos
            vectorB.appendChild(cell); //hace que podamos ver las celdas en el contenedor del vector B
        }
    }

    //función para verificar si una fila de la matriz es diagonalmente dominante
    function esDominante(fila, i) 
    {
        let suma = fila.reduce((a, b) => Math.abs(a) + Math.abs(b), 0) - Math.abs(fila[i]); //sumamos los valores absolutos de la fila y restamos el valor absoluto del elemento diagonal  
        return Math.abs(fila[i]) >= suma; //comparamos el valor absoluto del elemento diagonal con la suma de los demás elementos de la fila para determinar si es diagonalmente dominante
    }

    //función para hacer la matriz diagonalmente dominante reordenando las filas
    function intentarHacerDominante(A, B) 
    {
        let p = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]; // todos los intercambios posibles para intentar encontrar una configuración dominante
        for (let idx of p) // iteramos sobre cada permutación de filas para verificar si alguna de ellas hace que la matriz sea diagonalmente dominante
        {
            let nA = [A[idx[0]], A[idx[1]], A[idx[2]]]; //creamos una nueva matriz nA con el orden de filas según la permutación actual
            if (esDominante(nA[0], 0) && esDominante(nA[1], 1) && esDominante(nA[2], 2)) // verificamos si la nueva matriz nA es diagonalmente dominante
            {
                return { A: nA, B: [B[idx[0]], B[idx[1]], B[idx[2]]], exito: true }; //reordenamos el vector B y la matriz A según la permutación que hace que la matriz sea diagonalmente dominante
            }
        }
        return { A, B, exito: false }; //si ninguna permutación hace que la matriz sea diagonalmente dominante, devolvemos la matriz original sin cambios y un indicador de que no se logró el objetivo
    }

    function verificarDominanciaSimple(A) // función para verificar si la matriz A es diagonalmente dominante en su orden actual
    {
        return esDominante(A[0],0) && esDominante(A[1],1) && esDominante(A[2],2); // verificamos cada fila de la matriz A para determinar si es diagonalmente dominante
    }

    //función para actualizar la visibilidad de los inputs según el criterio de parada seleccionado (error o iteraciones)
    function actualizarCriterio() 
    {
        if (criterio.value === "error") // si el criterio seleccionado es "error", mostramos el input de tolerancia y ocultamos el input de máximo de iteraciones
        {
            errorBox.style.display = "block";
            iterBox.style.display = "none";
        } else 
        {
            errorBox.style.display = "none";
            iterBox.style.display = "block";
        }
    }
    criterio.addEventListener("change", actualizarCriterio); // agregamos un evento para que cada vez que el usuario cambie el criterio de parada, se actualice la visibilidad de los inputs correspondientes
    actualizarCriterio(); // llamamos a la función para establecer la visibilidad inicial de los inputs según el criterio seleccionado por defecto

    //función para crear la ecuación de un plano en formato compatible con GeoGebra
    function crearEcuacion(a, b, c, d) 
    {
        return `(${a})*x + (${b})*y + (${c})*z = ${d}`; //creamos una cadena de texto que representa la ecuación del plano en geogebra

    }

    //función principal para resolver el sistema de ecuaciones utilizando el método de Gauss-Seidel
    function gaussSeidel(A, B, x, tol, maxIterLimit, usarError) 
    {
        let hist = []; //historial de iteraciones para mostrar en la tabla
        let actualX = [...x]; //creamos una copia del vector de valores iniciales para ir actualizándolo en cada iteración sin modificar el original
        
        //si usa error, permitimos como máximo 100 iteraciones 
        let limite = usarError ? 100 : maxIterLimit;

        for (let k = 0; k < limite; k++) // ciclo de iteraciones que se ejecuta hasta alcanzar el límite de iteraciones o la condición de error
        {
            let anteriorX = [...actualX]; //creamos una copia del vector actualX antes de actualizarlo para poder calcular el error relativo después de la actualización
            let errorFila = [0, 0, 0]; //vector para almacenar el error relativo porcentual aproximado de cada fila, inicializado en 0 para cada una

            for (let i = 0; i < 3; i++) // ciclo para actualizar cada variable X1, X2, X3 en cada iteración
            {
                let suma = B[i]; // paso 1: Comenzamos el despeje tomando el valor de la constante en el vector de resultados (b)
                for (let j = 0; j < 3; j++)  // paso 2: Recorremos las columnas para restar los términos que no están en la diagonal
                {
                    if (i !== j) suma -= A[i][j] * actualX[j]; // restamos el producto del coeficiente A[i][j] por el valor actual de X[j] para cada término que no está en la diagonal
                }
                
                if (Math.abs(A[i][i]) < 1e-15) return { error: "Cero en diagonal", hist }; // Si el elemento diagonal es cero 

                actualX[i] = suma / A[i][i]; // paso 3: Dividimos la suma obtenida entre el coeficiente diagonal para obtener el nuevo valor de X[i]
                
                // cálculo de error relativo porcentual aproximado
                let diff = Math.abs(actualX[i] - anteriorX[i]); 
                errorFila[i] = (actualX[i] !== 0) ? (diff / Math.abs(actualX[i])) * 100 : diff * 100; // Si el nuevo valor de X[i] no es cero, calculamos el error 
            }

            hist.push({ x: [...actualX], error: [...errorFila] }); // guardamos el nuevo vector de soluciones y los errores correspondientes en el historial para mostrar en la tabla de iteraciones

            if (usarError) // si el criterio de parada es por error, verificamos si los errores de las tres filas son menores a la tolerancia para decidir si se detiene el proceso iterativo
            {
                // condición: que los tres errores sean menores a la tolerancia
                if (errorFila[0] < tol && errorFila[1] < tol && errorFila[2] < tol) 
                {
                    break; // si se cumple la condición de error, salimos del ciclo de iteraciones
                }
            }
        }
        return { error: null, hist }; // devolvemos el historial de iteraciones para mostrar en la tabla, sin ningún error
    }

    //evento para el botón de graficar que ejecuta el método de Gauss-Seidel y actualiza la gráfica y la tabla de iteraciones con los resultados obtenidos
    btn.onclick = () => 
    {
        const c = document.querySelectorAll("#matriz .cell"); // seleccionamos todas las celdas del contenedor de la matriz A para obtener los valores ingresados por el usuario
        const b = document.querySelectorAll("#vectorB .cell");// seleccionamos todas las celdas del contenedor del vector B para obtener los valores ingresados por el usuario

        let A = //creamos la matriz A a partir de los valores obtenidos de las celdas, convirtiendo el texto a números usando la función num
        [
            [num(c[0].innerText), num(c[1].innerText), num(c[2].innerText)], // primera fila de la matriz A
            [num(c[3].innerText), num(c[4].innerText), num(c[5].innerText)], // segunda fila de la matriz A
            [num(c[6].innerText), num(c[7].innerText), num(c[8].innerText)] // tercera fila de la matriz A
        ];
        let B = [num(b[0].innerText), num(b[1].innerText), num(b[2].innerText)]; //creamos el vector B a partir de los valores obtenidos de las celdas, convirtiendo el texto a números usando la función num

        if (!verificarDominanciaSimple(A)) // verificamos si la matriz A es diagonalmente dominante en su orden actual, y si no lo es, intentamos hacerla dominante reordenando las filas
        { 
            const reintento = intentarHacerDominante(A, B); // intentamos hacer la matriz diagonalmente dominante reordenando las filas
            if (reintento.exito) // si logramos hacer la matriz diagonalmente dominante, actualizamos A y B con la nueva configuración y mostramos un mensaje al usuario indicando que se hizo el reordenamiento para asegurar la convergencia del método de Gauss-Seidel
            {
                alert("Matriz reordenada para asegurar convergencia."); 
                A = reintento.A; B = reintento.B; // actualizamos A y B con la nueva configuración diagonalmente dominante
            } else 
            {
                if (!confirm("No se pudo hacer dominante. Puede que no converja. ¿Continuar?")) return; 
            }
        }

        let x0 = [num(x1Input.value), num(x2Input.value), num(x3Input.value)]; // obtenemos los valores iniciales para X1, X2, X3 a partir de los inputs correspondientes, convirtiendo el texto a números usando la función num
        const usarError = (criterio.value === "error"); // determinamos si el criterio de parada es por error o por iteraciones según la selección del usuario
        const tol = num(toleranciaInput.value); // obtenemos la tolerancia para el criterio de error a partir del input correspondiente, convirtiendo el texto a número usando la función num
        const maxIter = parseInt(maxIterInput.value); // obtenemos el máximo de iteraciones para el criterio de iteraciones a partir del input correspondiente, convirtiendo el texto a entero usando parseInt

        if (ggb) { // si la instancia de GeoGebra está disponible, actualizamos la gráfica con los planos correspondientes 
            ggb.deleteObject("p1"); ggb.deleteObject("p2"); ggb.deleteObject("p3"); // eliminamos los planos anteriores para evitar superposición 
            ggb.evalCommand(`p1: ${crearEcuacion(...A[0], B[0])}`); // creamos el plano correspondiente a la primera fila de la matriz A y el vector B 
            ggb.evalCommand(`p2: ${crearEcuacion(...A[1], B[1])}`);
            ggb.evalCommand(`p3: ${crearEcuacion(...A[2], B[2])}`);
            ggb.setColor("p1", 231, 76, 60); ggb.setColor("p2", 46, 204, 113); ggb.setColor("p3", 52, 152, 219); // asignamos colores diferentes a cada plano para diferenciarlos visualmente
        }

        const res = gaussSeidel(A, B, x0, tol, maxIter, usarError); // ejecutamos el método de Gauss-Seidel con los parámetros obtenidos y almacenamos el resultado en la variable res
        if (res.error) { alert(res.error); return; } // si hubo un error durante la ejecución del método de Gauss-Seidel, mostramos un mensaje al usuario y detenemos el proceso

        const data = res.hist; // obtenemos el historial de iteraciones para mostrar en la tabla y el resultado final
        const last = data[data.length - 1]; // obtenemos la última iteración del historial para mostrar el resultado final de X1, X2, X3 después de completar las iteraciones

        // Actualizamos el contenedor de resultados con el resultado final de X1, X2, X3 y el número de iteraciones completadas
        document.getElementById("resultado").innerHTML = `
            <div style="padding: 15px; background: #f8f9fa; border-left: 5px solid #2ecc71;"> 
                <h4>Iteraciones completadas: ${data.length}</h4> 
                <p><b>X₁</b> = ${last.x[0].toFixed(6)}</p> 
                <p><b>X₂</b> = ${last.x[1].toFixed(6)}</p> 
                <p><b>X₃</b> = ${last.x[2].toFixed(6)}</p>
            </div>
        `;

        const tbody = document.getElementById("tabla-body"); // seleccionamos el cuerpo de la tabla donde mostraremos el historial de iteraciones
        tbody.innerHTML = ""; // limpiamos el contenido anterior de la tabla para mostrar solo el nuevo historial de iteraciones

        // iteramos sobre cada elemento del historial de iteraciones para crear una nueva fila en la tabla con los valores de X1, X2, X3 y los errores correspondientes para cada iteración
        data.forEach((it, index) => {
            const row = document.createElement("tr"); // creamos una nueva fila para la tabla
            // llenamos la fila con los valores de X1, X2, X3 y los errores correspondientes para cada iteración
            row.innerHTML = `
                <td>${it.x[0].toFixed(5)}</td>
                <td>${it.x[1].toFixed(5)}</td>
                <td>${it.x[2].toFixed(5)}</td>
                <td style="color: #000000">${it.error[0].toFixed(2)}%</td>
                <td style="color: #000000">${it.error[1].toFixed(2)}%</td>
                <td style="color: #000000">${it.error[2].toFixed(2)}%</td>
            `;
                tbody.appendChild(row); // agregamos la nueva fila al cuerpo de la tabla para mostrar el historial de iteraciones actualizado con los nuevos resultados obtenidos del método de Gauss-Seidel
            });
    };
});