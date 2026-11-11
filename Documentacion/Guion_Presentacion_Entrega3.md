# Guion de exposición · Reservas UNAB · Hito 3

Presentación: `Presentacion_Entrega3.pptx` (basada en la plantilla UNAB) · 10 diapositivas · **8:35 min** (máximo 9), a unas 120 palabras por minuto.

Reparto: Agustin presenta el frontend, Jhon el backend y Zaid la base de datos. El mismo texto está en las notas del orador.

| Expositor | Diapositivas | Tiempo |
|---|---|---|
| Agustin Carmona | 1, 2, 7, 10 | 2:50 |
| Jhon Rojas | 3, 4, 6 | 2:45 |
| Zaid Isamit Alvial | 5, 8, 9 | 3:00 |

| # | Diapositiva | Expositor | Tiempo |
|---|---|---|---|
| 1 | Portada | Agustin Carmona | 0:20 |
| 2 | 01. Problema y continuidad | Agustin Carmona | 0:55 |
| 3 | 02. Evolución funcional | Jhon Rojas | 0:55 |
| 4 | 03. Arquitectura | Jhon Rojas | 0:50 |
| 5 | 04. Modelo de datos | Zaid Isamit Alvial | 1:05 |
| 6 | 05. Backend | Jhon Rojas | 1:00 |
| 7 | 06. Frontend | Agustin Carmona | 1:00 |
| 8 | 07. Flujo end-to-end | Zaid Isamit Alvial | 1:05 |
| 9 | 08. Calidad e IA | Zaid Isamit Alvial | 0:50 |
| 10 | 09. Resultado y decisiones | Agustin Carmona | 0:35 |

## 1. Portada · 0:20

**Agustin Carmona**

Buenos días. Somos Agustin, Jhon y Zaid, y presentamos Reservas UNAB, caso 3.1, Gestión de espacios universitarios. En este hito el prototipo del Taller 2 pasó a ser una plataforma Full Stack. Todo lo que verán son capturas y resultados reales del sistema.

## 2. 01. Problema y continuidad · 0:55

**Agustin Carmona**

El problema es que no existe un lugar único para ver qué espacios están libres, pedir una reserva, que alguien la apruebe y medir su uso. Los usuarios son estudiantes, docentes y organizaciones, cada uno con un límite de horas, y agregamos un actor nuevo: la administración de espacios. Abajo está el prototipo real del Taller 2. Resolvía la búsqueda, pero tenía una brecha de fondo: los datos vivían en el navegador, así que una reserva hecha en un computador no existía para nadie más. Tampoco había contraseña ni aprobación, y los choques de horario solo se controlaban en la pantalla. Conservamos el caso y el diseño, y cambiamos lo que impedía que funcionara de verdad. Ahora Jhon explica qué agregamos.

## 3. 02. Evolución funcional · 0:55

**Jhon Rojas**

Implementamos las seis funcionalidades obligatorias del caso: administración de infraestructura, ficha de cada espacio, el ciclo completo de la reserva, la validación de conflictos, las reservas personales con historial y un panel de indicadores, que se ve abajo. Destaco dos reglas. Primera: un espacio no puede tener dos reservas activas que se crucen; si pasa, la API responde 409 y el intento se guarda para medir la demanda no atendida. Segunda: cada rol tiene un máximo de horas y no se puede superar la capacidad; eso responde 422. El valor es que la reserva dejó de ser un dato local: es compartida, tiene un responsable y deja trazabilidad.

## 4. 03. Arquitectura · 0:50

**Jhon Rojas**

La arquitectura tiene tres capas. React solo presenta datos y habla con la API por HTTP y JSON. La API concentra todas las reglas y es la única que accede a PostgreSQL y MongoDB; Swagger documenta ese contrato. Una decisión concreta: el servidor nginx que entrega la web también reenvía las rutas /api al backend, así ambos quedan en el mismo origen y no dependemos de CORS. Elegimos Express porque usamos JavaScript en ambos lados, y tokens JWT sin estado porque la app móvil del Hito 4 usará esta misma API. Zaid explica ahora cómo guardamos los datos.

## 5. 04. Modelo de datos · 1:05

**Zaid Isamit Alvial**

Usamos dos bases con propósitos distintos. PostgreSQL guarda el estado actual en nueve tablas: sedes, edificios, espacios, equipamiento, roles, usuarios y reservas. La integridad está en la propia base: claves foráneas, CHECK para rangos y estados, UNIQUE para RUT y código de sala, y RESTRICT para no borrar un espacio que tiene reservas. MongoDB tiene la colección eventos: cada acción genera un documento que nunca se modifica. El de la derecha es real. Lo usan el historial de cada reserva, la bitácora de auditoría y la demanda no atendida. No es duplicación: SQL dice cómo está la reserva ahora y MongoDB dice qué pasó, incluidos los intentos rechazados que nunca llegan a ser una fila. Jhon sigue con el backend.

## 6. 05. Backend · 1:00

**Jhon Rojas**

El backend está hecho en Node con Express 5 y separado en capas: las rutas, los middlewares que verifican el token y validan los datos con Zod, el controlador, el servicio con las reglas y el repositorio con las consultas. No usamos ORM para controlar directamente el SQL, y todas las consultas son parametrizadas. Las reglas son funciones puras, así que se prueban sin base de datos. Cada caso tiene un código preciso: 400 si el formato es inválido, 409 si choca con otra reserva y 422 si viola una regla, como exceder las horas del rol. La API tiene 31 operaciones en Swagger; a la derecha, una prueba real: un login con contraseña incorrecta devuelve 401. Agustin muestra el frontend.

## 7. 06. Frontend · 1:00

**Agustin Carmona**

El frontend mantiene el diseño del Taller 2, pero ahora todos los datos vienen de la API. Ninguna página hace peticiones directamente: todas pasan por un solo módulo, http.js, que agrega el token y convierte los errores del servidor en mensajes que el formulario muestra campo por campo. Los formularios se validan en el cliente para responder rápido, como en la captura del motivo vacío, y el servidor valida otra vez, porque la validación del cliente se puede saltar. Cada vista muestra carga, error con reintento, vacío y éxito, y el diseño es responsive. Los archivos JSON y el localStorage se reemplazaron por las bases de datos; la API de clima se mantuvo. Zaid mostrará el flujo completo.

## 8. 07. Flujo end-to-end · 1:05

**Zaid Isamit Alvial**

Este es el flujo completo con datos reales. Uno: un estudiante elige un bloque libre en el Patio central. Dos: React llama a POST /api/reservas con su token; la API autentica, valida y aplica las reglas. Tres: se guarda la reserva 22 en PostgreSQL como pendiente y el evento en MongoDB. Cuatro: la API responde 201 y React muestra la confirmación. Para el caso de error enviamos seis solicitudes simultáneas al mismo bloque: solo una se crea y cinco reciben 409. Eso lo garantiza una restricción EXCLUDE de PostgreSQL, que impide horarios cruzados aunque lleguen al mismo tiempo. Y abajo a la derecha, la consulta a la tabla confirma que la reserva quedó guardada.

## 9. 08. Calidad e IA · 0:50

**Zaid Isamit Alvial**

Cualquier persona puede ejecutar el proyecto con docker compose: se levantan el frontend, el backend, PostgreSQL y MongoDB; el backend espera a que las bases estén listas y los datos de prueba se cargan solos. El repositorio Entrega-3-Pagina-Web en GitHub usa ramas main, develop y una rama por funcionalidad, y su README explica arquitectura, API, ejecución y limitaciones. Tenemos 25 pruebas unitarias y 22 de integración contra la API real, y todas pasan. Usamos Claude Code como apoyo y lo declaramos en el README; todo lo generado lo validamos revisando el código, ejecutando las pruebas y probando cada flujo. Con este botón abrimos la plataforma funcionando.

## 10. 09. Resultado y decisiones · 0:35

**Agustin Carmona**

En resumen, la plataforma hace lo que el prototipo no podía: reservas compartidas, con aprobación, sin doble reserva, con historial e indicadores. La decisión más importante fue llevar la regla de la doble reserva a la base de datos. En el Hito 4, la app en React Native usará esta misma API. Muchas gracias; quedamos atentos a sus preguntas.
