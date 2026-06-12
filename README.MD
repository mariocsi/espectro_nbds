# Espectro Sísmico NBDS 2023

Aplicación web estática para calcular el espectro sísmico según la normativa NBDS 2023 de Bolivia.

## Descripción

Este proyecto incluye una interfaz interactiva que permite seleccionar datos de amenaza sísmica, tipo de suelo, factor de importancia, sistema estructural, factor topográfico y irregularidades de diseño. Calcula el espectro elástico y el espectro de diseño y muestra los resultados en un gráfico interactivo.

## Archivos principales

- `NBDS2023_Espectro_1.html` - Página principal de la aplicación.
- `NBDS2023_Espectro_1.js` - Lógica de cálculo del espectro, gráficos y descarga CSV.
- `NBDS2023_Espectro_1.css` - Estilos para escritorio.
- `NBDS2023_Espectro_1.responsive.css` - Estilos responsivos para móviles.
- `mapa_de_amenaza_sismica.jpg` - Imagen de apoyo para el mapa probabilístico de amenaza sísmica.

## Funcionalidades

- Cálculo de coeficientes de sitio `Fa` y `Fv` según tipo de suelo.
- Selección de catalogación estructural y factor de importancia.
- Opciones de factor topográfico `τ` con cálculo automático o valores directos.
- Panel de irregularidades `FIT` con impacto en el factor final.
- Gráfico interactivo del espectro de respuesta usando Chart.js.
- Descarga del espectro en formato CSV.

## Uso

1. Abra `NBDS2023_Espectro_1.html` en su navegador.
2. Ingrese o ajuste los parámetros de amenaza sísmica y características del suelo.
3. Seleccione el sistema estructural y el factor de importancia.
4. Presione `CALCULAR ESPECTRO`.
5. Revise los resultados y descargue el espectro en CSV si lo desea.

## Dependencias

- `Chart.js` se carga desde CDN en el archivo HTML.

## Notas

- La aplicación es completamente estática y no requiere servidor backend.
- Ideal para revisar y validar espectros según NBDS 2023 en Bolivia.
