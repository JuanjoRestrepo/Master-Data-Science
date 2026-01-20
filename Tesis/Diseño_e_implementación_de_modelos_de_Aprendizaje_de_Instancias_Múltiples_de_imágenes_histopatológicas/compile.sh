#!/bin/bash
cd "$(dirname "$0")"
pdflatex -interaction=nonstopmode main.tex
pdflatex -interaction=nonstopmode main.tex  
pdflatex -interaction=nonstopmode main.tex
echo "Compilación completada"
