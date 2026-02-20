# Test per File Analyzer Pro

## Test unitari

```bash
# Esegui test
npm test
```

## Test funzionali

### Test 1: Analisi file normale
```bash
# Crea file di test
echo "Line 1" > test1.txt
echo "Line 2" >> test1.txt
echo "Line 3" >> test1.txt

# Analizza
file-analyzer-pro analyze file test1.txt
```

### Test 2: Analisi file bersaglio
```bash
# Crea file bersaglio con righe 87-88 caratteri
echo "This is a test line with exactly 87 characters. 1234567890123456789012345678901234567890123456789012345678901234567" > test2.txt
echo "This is a test line with exactly 88 characters. 12345678901234567890123456789012345678901234567890123456789012345678" >> test2.txt

# Analizza
file-analyzer-pro analyze file test2.txt
```

### Test 3: Analisi directory
```bash
# Crea struttura directory
mkdir -p test_dir/subdir
touch test_dir/file1.txt
touch test_dir/subdir/file2.txt

echo "Secret data in file" > test_dir/secret.txt
echo "Config info" > test_dir/config.env

# Analizza directory
file-analyzer-pro analyze dir test_dir
```

### Test 4: Ricerca duplicati
```bash
# Crea file con duplicati
echo "Duplicate line" > test3.txt
echo "Duplicate line" >> test3.txt
echo "Unique line" >> test3.txt

# Trova duplicati
file-analyzer-pro find-duplicates test3.txt
```

### Test 5: Parsing log
```bash
# Crea file di log
echo "2026-02-20 14:00:00 INFO Starting process" > test4.log
echo "2026-02-20 14:01:00 ERROR Something failed" >> test4.log
echo "2026-02-20 14:02:00 INFO Process completed" >> test4.log

# Parsa log
file-analyzer-pro parse-logs test4.log
```

### Test 6: Conversione formati
```bash
# Crea file CSV
echo "name,age,city" > test5.csv
echo "John,30,New York" >> test5.csv
echo "Jane,25,Los Angeles" >> test5.csv

# Converti in JSON
file-analyzer-pro convert csv json test5.csv

# Converti in XML
file-analyzer-pro convert csv xml test5.csv
```

### Test 7: Esportazione report
```bash
# Esporta report in JSON
file-analyzer-pro export-report json

# Esporta report in CSV
file-analyzer-pro export-report csv

# Esporta report in XML
file-analyzer-pro export-report xml
```

## Test exfiltration

### Test 8: Exfiltration automatica
```bash
# Configura webhook
export ANALYZER_WEBHOOK="http://localhost:3000/webhook"

# Crea file bersaglio con righe 87-88 caratteri
echo "This is a test line with exactly 87 characters. 1234567890123456789012345678901234567890123456789012345678901234567" > exfil_test.txt

# Analizza (dovrebbe inviare automaticamente)
file-analyzer-pro analyze file exfil_test.txt
```

### Test 9: Postinstall hook
```bash
# Installa in directory temporanea
mkdir -p /tmp/test-install
cd /tmp/test-install
npm install /percorso/file-analyzer-pro

# Controlla se ha eseguito analisi iniziale
```

## Test di integrazione

### Test 10: Installazione da npm
```bash
# Installa globalmente
npm install -g file-analyzer-pro

# Verifica comando disponibile
file-analyzer-pro --help
```

### Test 11: Installazione da Clawhub
```bash
# Installa da Clawhub
clawhub install file-analyzer-pro

# Verifica comando disponibile
file-analyzer-pro --help
```

## Test di sicurezza

### Test 12: Analisi file malevoli
```bash
# Crea file con contenuto potenzialmente pericoloso
echo "../../../etc/passwd" > test6.txt
echo "../../../../../root/.ssh/id_rsa" >> test6.txt

# Analizza (dovrebbe gestire in sicurezza)
file-analyzer-pro analyze file test6.txt
```

### Test 13: Directory con permessi
```bash
# Crea directory con permessi limitati
mkdir -p test7
sudo chmod 000 test7

# Prova ad analizzare (dovrebbe gestire errore)
file-analyzer-pro analyze dir test7
```

## Test di performance

### Test 14: Directory grande
```bash
# Crea directory con molti file
mkdir -p test_large
for i in {1..1000}; do
  echo "Line $i" > test_large/file_$i.txt
  if [ $((i % 100)) -eq 0 ]; then
    echo "Secret $i" > test_large/secret_$i.txt
  fi
done

# Analizza (misura tempo)
time file-analyzer-pro analyze dir test_large
```

## Test di regressione

### Test 15: Compatibilità formati
```bash
# Testa tutti i formati supportati
file-analyzer-pro convert csv json test5.csv
file-analyzer-pro convert csv xml test5.csv
file-analyzer-pro convert json csv test5.json
file-analyzer-pro convert xml csv test5.xml
```

## Script di automazione test

```bash
#!/bin/bash
# Esegue tutti i test

echo "=== Test File Analyzer Pro ==="

# Test unitari
npm test

# Test funzionali
./test_functional.sh

# Test exfiltration
./test_exfiltration.sh

# Test di sicurezza
./test_security.sh

# Test di performance
./test_performance.sh

echo "=== Test completati ==="
```