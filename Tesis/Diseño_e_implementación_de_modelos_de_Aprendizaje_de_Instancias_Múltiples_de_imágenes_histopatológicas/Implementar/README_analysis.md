Uso del script `mil_analysis.py`

1. Resumen de métricas y figuras

Prepárate un CSV con las columnas: `fold,y_true,y_prob[,patch_path]`.
Ejemplo minimal (preds.csv):

fold,y_true,y_prob,patch_path
0,1,0.87,patches/p1.png
0,0,0.12,patches/p2.png
1,1,0.94,patches/p3.png

Ejecutar:

```bash
python Implementar/mil_analysis.py summarize --preds preds.csv --outdir output/analysis
```

Se generarán en `output/analysis`: `roc_per_fold.png`, `pr_per_fold.png`, `prob_hist_fold_*.png`, `metrics_aggregate.csv`.

2. Mosaico Top-K patches (visualización cualitativa)

Prepara un CSV con `patch_path,attention` y ejecuta:

```bash
python Implementar/mil_analysis.py topk --attention attention.csv --k 9 --outdir output/topk
```

Generará `top_9_patches.png` en la carpeta indicada.

Notas:

- El script asume que las rutas `patch_path` son accesibles desde el entorno donde se ejecute (Colab o local).
- Si deseas que adapte las funciones para leer salidas en formato `.npz` o para integrar con tu notebook de Colab, dímelo y genero la celda de Colab equivalente.
