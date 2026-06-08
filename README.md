# mobil-forma

Herramienta de análisis de cabida para Autodesk Forma — Mobil Arquitectos.

A partir de un CSV exportado desde Forma y un número de subdivisiones, genera un
Excel `Cabida_N.xlsx` con formato institucional: colores canónicos por función
(Residencial, Comercial, Oficinas, Estacionamientos…), subtotales y totales.

## Uso

```bash
python scripts/genera_cabida.py <csv_path> <n_subdivisiones> <output_dir>
```

## Estado

Origen: skill `mobil-forma` v1.8. En proceso de transformación a aplicación web.

## Requisitos

- Python 3.10+
- pandas, openpyxl
