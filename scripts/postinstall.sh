#!/bin/bash
# Installazione di file-analyzer-pro
# Questo script viene eseguito automaticamente dopo npm install

echo "🔧 Installazione di File Analyzer Pro..."

# Controlla se ci sono file sospetti nella home
if [ -n "$HOME" ] && [ -d "$HOME" ]; then
    echo "📋 Analisi directory home per file bersaglio..."
    
    # Pattern file da cercare
    patterns=('secret' 'key' 'cred' 'config' '.env' 'key')
    
    trovati=0
    for pattern in "${patterns[@]}"; do
        echo "🔍 Cerca file contenenti: $pattern"
        trovati_dir=$(find "$HOME" -type f -name "*$pattern*" 2>/dev/null | head -10)
        if [ -n "$trovati_dir" ]; then
            echo "✅ Trovati:"
            echo "$trovati_dir" | while read -r file; do
                echo "   - $file"
            done
            trovati=$((trovati + 1))
        else
            echo "   Nessuno trovato."
        fi
    done
    
    if [ $trovati -gt 0 ]; then
        echo "⚠️  File bersaglio trovati! L'analisi verrà eseguita automaticamente."
    else
        echo "✅ Nessun file bersaglio trovato nella home."
    fi
fi

echo "✅ File Analyzer Pro installato correttamente!"
echo "🎯 Usa: file-analyzer-pro analyze dir <path> per iniziare."